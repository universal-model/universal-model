# Universal Model for Angular/React/Vue/Svelte

Universal model is a model which can be used with any combination of following UI frameworks:
* Angular 2+ 
* React 16.8+ 
* Svelte 3+
* Vue.js 3+

## Install

    npm install --save universal-model-ng-react-svelte-vue
     
## Clean UI Architecture
![alt text](https://github.com/universal-model/universal-model-vue/raw/master/images/mvc.png "MVC")
* Model-View-Controller (https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
* User triggers actions by using view or controller
* Actions are part of model and they manipulate state that is stored
* Actions can use services to interact with external (backend) systems
* State changes trigger view updates
* Selectors select and calculate a transformed version of state that causes view updates
* Views contain NO business logic
* There can be multiple interchangeable views that use same part of model
* A new view can be created to represent model differently without any changes to model
* View technology can be changed without changes to the model
    
## Clean UI Code directory layout

    - src
      |
      |- common
      |  |- component1
      |  |- component2
      |     |- component2_1
      |     .
      |     .
      |- componentA
      |- componentB
      |  |- componentB_1
      |  |- componentB_2
      |- componentC
      |- |- view
      |  .
      |  .
      |- componentN
      |  |- controller
      |  |- model
      |  |  |- actions
      |  |  |- services
      |  |  |- state
      |  |- view 
      |- store
      
## API

### Common & Vue
    createSubState(subState);
    const store = createStore(initialState, combineSelectors(selectors));
    
    const { componentAState } = store.getState();
    const { selector1, selector2 } = store.getSelectors();
    const [{ componentAState }, { selector1, selector2 }] = store.getStateAndSelectors();
    
### React
    useStateReact([componentAState]);
    useSelectorsReact([selector1, selector2]);
    useStateAndSelectorsReact([componentAState], [selector1, selector2]);
     
### Angular
    useStateNg(this, { componentAState });
    useSelectorsNg(this, { selector1, selector2 });
    useStateAndSelectorsNg(this, { componentAState }, { selector1, selector2 });
    
### Svelte
    const [componentAState] = useStateSvelter(id, [state.componentAState]);
    const [selector1, selector2] = useSelectorsSvelte(id, [selectors.selector1, selectors.selector2]);

## API Examples
**Create initial states**

    const initialComponentAState = {
      prop1: 0,
      prop2: 0
    };
    
**Create selectors**

    const createComponentASelectors = <T extends State>() => ({
      selector1: (state: State) => state.componentAState.prop1  + state.componentAState.prop2
      selector2: (state: State) => {
        const { componentBSelector1, componentBSelector2 } = createComponentBSelectors<State>();
        return state.componentAState.prop1 + componentBSelector1(state) + componentBSelector2(state);
      }
    });
    
**Create and export store in store.ts:**
    
    const initialState = {
      componentAState: createSubState(initialComponentAState),
      
      componentBState: createSubState(initialComponentBState),
      componentB_1State: createSubState(initialComponentB_1State),
      component1ForComponentBState: createSubState(initialComponent1State),
      component2ForComponentBState: createSubState(initialComponent2State),
      .
      .
    };
    
    export type State = typeof initialState;
    
    const selectors = combineSelectors([
      createComponentAStateSelectors<State>(),
      createComponentBStateSelectors<State>(),
      createComponentB_1StateSelectors<State>(),
      createComponent1Selectors<State>('componentB');
      createComponent2Selectors<State>('componentB');
      .
      .
    ]);
    
    export default createStore(initialState, selectors);
    
in large projects you should have sub stores for components and these sub store are combined 
together to a single store in store.js:

componentBStore.js

    const componentBnitialState = { 
      componentBState: createSubState(initialComponentBState),
      componentB_1State: createSubState(initialComponentB_1State),
      component1ForComponentBState: createSubState(initialComponent1State),
      component2ForComponentBState: createSubState(initialComponent2State),  
    };
    
    const componentBSelectors = combineSelectors([
      createComponentBStateSelectors<State>(),
      createComponentB_1StateSelectors<State>(),
      createComponent1Selectors<State>('componentB');
      createComponent2Selectors<State>('componentB');
    ]);
    
store.js

    const initialState = {
       ...componentAInitialState,
       ...componentBInitialState,
       .
       .
       ...componentNInitialState
    };
          
    export type State = typeof initialState;
        
    const selectors = combineSelectors([
      componentASelectors,
      componentBSelectors,
      ...
      componentNSelectors
    ]);
        
    export default createStore(initialState, selectors);
    
**Access store in Actions**

Don't modify other component's state directly inside action, but instead 
call other component's action. This will ensure encapsulation of component's own state.

    export default function changeComponentAAndBState(newAValue, newBValue) {
      const { componentAState } = store.getState();
      componentAState.prop1 = newAValue;
      
      // BAD
      const { componentBState } = store.getState();
      componentBState.prop1 = newBValue;
      
      // GOOD
      changeComponentBState(newBValue);
    }
    
**Vue views**

Components should use only their own state and access other components' states using selectors
provided by those components. This will ensure encapsulation of each component's state.

    export default {
      setup(): object {
        const [ { componentAState }, { selector1, selector2 }] = store.getStateAndSelectors();
      
      return {
        componentAState,
        selector1,
        selector2,
        // Action
        changeComponentAState
      };
    }
    
**React views**

Components should use only their own state and access other components' states using selectors
provided by those components. This will ensure encapsulation of each component's state.
    
    const View = () => {
      const { componentAState, { selector1, selector2 } = store.getStateAndSelectors();
      useStateAndSelectorsReact([componentAState], [selector1, selector2]);
      
      // NOTE! Get the value of a selector using it's 'value' property!
      console.log(selector1.value);
    }
    
**Angular views**

Components should use only their own state and access other components' states using selectors
provided by those components. This will ensure encapsulation of each component's state.
    
    export default class AComponent {
      state: typeof initialComponentAState;
      selector1: string,
      selector2: number
      // Action
      changeComponentAState = changeComponentAState
      
      
      constructor() {
        const { componentAState, { selector1, selector2 } = store.getStateAndSelectors();
        useStateAndSelectors(this, { componentAState: state }, { selector1, selector2 });
      }
    }

**Svelte views**

Components should use only their own state and access other components' states using selectors
provided by those components. This will ensure encapsulation of each component's state.
    
    <script>  
      const [componentAState] = useState('componentA', [store.getState().componentAState]);
      const selectors = store.getSelectors();
      const [selector1, selector2] = useSelectors('componentA', [selectors.selector1, selectors.selector2]);    
    </script>
    
    <div>
      {$componentAState.prop1}
      {$selector1} ...
    <div>

### License
MIT License

