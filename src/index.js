import React from 'react';
import ReactDOM from 'react-dom';

// Slomux - реализация Flux, в которой, как следует из нвазвания, что-то сломано.
// Нужно выяснить что здесь сломано

const createStore = (reducer, initialState) => {
    let currentState = initialState
    const listeners = []

    const getState = () => currentState
    const dispatch = action => {
        // добавлена проверка на изменение currentState, что бы не вызывать перерисовку без надобности
        const newState = reducer(currentState, action)
        if (newState !== currentState) {
            currentState = newState
            listeners.forEach(listener => listener())
        }
    }

    const subscribe = listener => listeners.push(listener)

    return { getState, dispatch, subscribe }
}

// Context для store, в качестве default value пустышка
const StoreContext = React.createContext(createStore(() => { }, {}))

const connect = (mapStateToProps, mapDispatchToProps) =>
    Component => // конструкция '() => { return value }' изменена на '() => value'
        class extends React.Component {
            static contextType = StoreContext

            render() {
                return (
                    <Component
                        {...mapStateToProps(this.context.getState(), this.props)}
                        {...mapDispatchToProps(this.context.dispatch, this.props)}
                        {...this.props} // изначально забыли прокинуть props
                    />
                )
            }

            componentDidMount() {
                this.context.subscribe(this.handleChange)
            }

            // сокращена запись
            handleChange = () => this.forceUpdate()
        }

class Provider extends React.Component {
    // componentwillmount is legacy https://reactjs.org/docs/react-component.html#unsafe_componentwillmount
    // These methods are considered legacy and you should avoid them in new code
    // Потому componentwillmount был убран
    // хранение store в глобальной переменной - потенциальный источник множества проблем
    constructor(props) {
        super(props)

        this.state = {
            store: props.store,
        }
    }

    render() {
        const { children } = this.props
        const { store } = this.state
        return (
            <StoreContext.Provider value={store}>
                {children}
            </StoreContext.Provider>
        )
    }
}

// APP

// actions
const ADD_TODO = 'ADD_TODO'

// action creators
const addTodo = todo => ({
    type: ADD_TODO,
    payload: todo,
})

// reducers
const reducer = (state = [], action) => {
    switch (action.type) {
        case ADD_TODO:
            // SLOMUX наверняка не имеет такого принципа как 'State is read-only' но исходя из реализации автор скорее всего это предполагал...
            return [...state, action.payload]
        default:
            return state
    }
}

// components
class ToDoComponent extends React.Component {
    state = {
        todoText: ''
    }

    // defaultProps вместо 'val || defaultVal'
    static defaultProps = {
        title: 'Без названия',
    }

    render() {
        const { title, todos } = this.props
        const { todoText } = this.state

        return (
            <div>
                <label>{title}</label>
                <div>
                    <input
                        value={todoText}
                        placeholder="Название задачи"
                        onChange={this.updateText}
                    />
                    <button onClick={this.addTodo}>Добавить</button>
                    <ul>
                        {
                            // не забываем использовать keys
                            todos.map((todo, idx) => <li key={idx}>{todo}</li>)
                        }
                    </ul>
                </div>
            </div>
        )
    }

    // function изменена на lambda expression что бы не привязывать контекст в конструкторе
    // + так короче
    updateText = (e) => this.setState({ todoText: e.target.value })

    // тоже что и с updateText
    addTodo = () => {
        const { addTodo } = this.props
        const { todoText } = this.state

        addTodo(todoText)
        this.setState({ todoText: '' })
    }
}

const ToDo = connect(state => ({
    todos: state,
}), dispatch => ({
    addTodo: text => dispatch(addTodo(text)),
}))(ToDoComponent)

// init
ReactDOM.render(
    <Provider store={createStore(reducer, [])}>
        <ToDo title="Список задач" />
    </Provider>,
    document.getElementById('root')
)