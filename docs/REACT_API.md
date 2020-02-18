# React API Documentation

### Store::useState 
    
    useStateReact(subStates: SubState[]): void
    
makes React functional component to use given sub-state(s) and makes changes to given sub-state(s) to update the view.<br/>
**NOTE!** If you call only getState() and forget to call useState(), your view won't be reactive and does not update.

### Store::useSelectors

    useSelectorsReact(selectors: ComputedRef[]): void 
    
makes React functional component to use given selectors and makes changes to given selectors to update the view.<br/>
**NOTE!** If you call only getSelectors() and forget to call useSelectors(), your view won't be reactive and does not update.

### Store::useStateAndSelectors

    useStateAndSelectorsReact(subStates: SubState[], selectors: ComputedRef[]): void
    
makes React functional component to use given sub-state(s) and selectors and makes changes to given sub-state(s)
and selectors to update the view.<br/>
**NOTE!** If you call only getStateAndSelectors() and forget to call useStateAndSelectors(), your view won't be reactive and does not update.
