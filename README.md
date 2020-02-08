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
UI application is divided into UI components. Common UI components should be put into common directory. Each component
can consist of subcomponents. Each component has a view and optionally controller and model. Model consists of actions, state
and selectors. In large scale apps, model can contain sub-store. Application has one store which is composed of each components'
state (or sub-stores)

    - src
      |
      |- common
      |  |- component1
      |  |- component2
      |  . |- component2_1
      |  . 
      |  . 
      |  .
      |- componentA
      |- componentB
      |  |- componentB_1
      |  |- componentB_2
      |- componentC
      |  |- view
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

When using foreign state inside selectors, prefer creating foreign state selectors and accessing foreign
state through them instead of directly accessing foreign state inside selector. This will ensure  better
encapsulation of component state.

    const createComponentASelectors = <T extends State>() => ({
      selector1: (state: State) => state.componentAState.prop1  + state.componentAState.prop2
      selector2: (state: State) => {
        const { componentBSelector1, componentBSelector2 } = createComponentBSelectors<State>();
        return state.componentAState.prop1 + componentBSelector1(state) + componentBSelector2(state);
      }
    });
    
**Create and export store in store.ts:**

combineSelectors() checks if there are duplicate keys in selectors and will throw an error telling which key was duplicated.
By using combineSelectors you can keep your selector names short and only namespace them if needed.
    
    const initialState = {
      componentAState: createSubState(initialComponentAState),
      componentBState: createSubState(initialComponentBState)
    };
    
    export type State = typeof initialState;
    
    const componentAStateSelectors = createComponentAStateSelectors<State>();
    const componentBStateSelectors = createComponentBStateSelectors<State>();
    
    const selectors = combineSelectors<State, typeof componentAStateSelectors, typeof componentBStateSelectors>(
      componentAStateSelectors,
      componentBStateSelectors
    );
    
    export default createStore<State, typeof selectors>(initialState, selectors);
    
in large projects you should have sub-stores for components and these sub-store are combined 
together to a single store in store.js:

**componentBStore.js**

    const componentBInitialState = { 
      componentBState: createSubState(initialComponentBState),
      componentB_1State: createSubState(initialComponentB_1State),
      component1ForComponentBState: createSubState(initialComponent1State) 
    };
    
    const componentBStateSelectors = createComponentBStateSelectors<State>();
    const componentB_1StateSelectors = createComponentB_1StateSelectors<State>();
    const component1ForComponentBSelectors = createComponent1Selectors<State>('componentB');
    
    const componentBSelectors = combineSelectors<State, typeof componentBStateSelectors, typeof componentB_1StateSelectors, typeof component1ForComponentBSelectors>(
      componentBStateSelectors,
      componentB_1StateSelectors,
      component1ForComponentBSelectors
    );
    
**store.js**

    const initialState = {
      ...componentAInitialState,
      ...componentBInitialState,
      .
      ...componentNInitialState
    };
          
    export type State = typeof initialState;
        
    const selectors = combineSelectors<State, typeof componentASelectors, typeof componentBSelectors, ... typeof componentNSelectors>([
      componentASelectors,
      componentBSelectors,
      .
      componentNSelectors
    ]);
        
    export default createStore<State, typeof selectors>(initialState, selectors);
    
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
      const [{ componentAState, { selector1, selector2 }] = store.getStateAndSelectors();
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
        const [{ componentAState, { selector1, selector2 }] = store.getStateAndSelectors();
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

