# Angular API Documentation

### Store::useStateNg 
    
    useStateNg<V extends new (...args: any[]) => any>(
      componentInstance: InstanceType<V>,
      subStateMap: { [key: string]: SubState }
    ): void
    
makes given Angular component instance to use sub-state(s) given in subStateMap and makes changes to given sub-state(s) to update the view.<br/>
**Note!** If you call only getState() and forget to call useState(), your view won't be reactive and does not update.

### Store::useSelectorsNg

    useSelectorsNg<V extends new (...args: any) => any>(
      componentInstance: InstanceType<V>,
      selectorMap: { [key: string]: ComputedRef }
    ): void 
    
makes given Angular component instance to use selectors given in selectorMap and makes changes to given selectors to update the view.<br/>
**Note!** If you call only getSelectors() and forget to call useSelectors(), your view won't be reactive and does not update.

### Store::useStateAndSelectors

    useStateAndSelectorsNg<V extends new (...args: any[]) => any>(
      componentInstance: InstanceType<V>,
      subStateMap: { [key: string]: SubState },
      selectorMap: { [key: string]: ComputedRef }
    ): void
    
makes given Angular component instance to use sub-state(s) and selectors given in subStateMap and selectorMap and makes changes to given sub-state(s)
and selectors to update the view.<br/>
**Note!** If you call only getStateAndSelectors() and forget to call useStateAndSelectors(), your view won't be reactive and does not update.
