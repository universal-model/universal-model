# Svelte API Documentation

### Store::useState 
    
    useStateSvelte(id: string, subStates: SubState[]): Writable<SubState>[]
    
returns reactive sub-state(s) for Svelte component with given id and given sub-state(s)<br/>
**NOTE #1** If you only call getState() and forget to call useState(), your view won't be reactive and does not update.<br/>
**NOTE #2** Each Svelte component instance must have its own unique id given as the first argument.

### Store::useSelectors

    useSelectorsSvelte(id: string, selectors: ComputedRef[]): Writable<ComputedRef>[] 
    
returns reactive selectors for Svelte component with given id and given selectors<br/>
**NOTE #1** If you only call getSelectors() and forget to call useSelectors(), your view won't be reactive and does not update.<br/>
**NOTE #2** Each Svelte component instance must have its own unique id given as the first argument.

