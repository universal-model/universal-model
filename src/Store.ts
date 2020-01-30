import { Ref, UnwrapRef, ComputedRef, reactive, computed, StopHandle, watch } from 'vue';
import { SubStateFlagWrapper } from './createSubState';
import { useEffect, useState } from 'react';
import { Writable, writable } from 'svelte/store';
import { onDestroy } from 'svelte';

export type SubState = Omit<object, '__isSubState__'> & SubStateFlagWrapper;
export type State = { [key: string]: SubState };

export type SelectorsBase<T extends State> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (state: T) => any;
};

export type Selectors<T extends State, U extends SelectorsBase<T>> = {
  [K in keyof U]: (state: T) => ReturnType<U[K]>;
};

type ComputedSelectors<T extends State, U extends SelectorsBase<T>> = {
  [K in keyof U]: ComputedRef<ReturnType<U[K]>>;
};

type ReactiveState<T> = T extends Ref ? T : UnwrapRef<T>;

export default class Store<T extends State, U extends SelectorsBase<T>> {
  private readonly reactiveState: T extends Ref ? T : UnwrapRef<T>;
  private readonly reactiveSelectors: ComputedSelectors<T, U>;
  private readonly stateStopWatches = new Map();
  private readonly selectorStopWatches = new Map();
  private readonly stateWritables = new Map();
  private componentId = 0;

  constructor(initialState: T, selectors?: Selectors<T, U>) {
    this.reactiveState = reactive(initialState);
    this.reactiveSelectors = {} as ComputedSelectors<T, U>;
    if (selectors) {
      Object.keys(selectors).forEach(
        (key: keyof U) =>
          (this.reactiveSelectors[key] = computed(() =>
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            selectors[key](this.reactiveState)
          ))
      );
    }
  }

  getState(): ReactiveState<T> {
    return this.reactiveState;
  }

  getSelectors(): ComputedSelectors<T, U> {
    return this.reactiveSelectors;
  }

  getStateAndSelectors(): [ReactiveState<T>, ComputedSelectors<T, U>] {
    return [this.reactiveState, this.reactiveSelectors];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStateAndSelectorsReact(subStates: SubState[], selectors: ComputedRef<any>[]): void {
    this.useStateReact(subStates);
    this.useSelectorsReact(selectors);
  }

  useStateReact(subStates: SubState[]): void {
    const [, updateViewDueToStateChange] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      subStates.forEach((subState: SubState) => {
        if (!subState.__isSubState__) {
          throw new Error('useState: One of given subStates is not subState');
        }

        stopWatches.push(
          watch(
            () => subState,
            () => updateViewDueToStateChange({}),
            {
              deep: true
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelectorsReact(selectors: ComputedRef<any>[]): void {
    const [, updateViewDueToSelectorChange] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectors.forEach((selector: any) => {
        stopWatches.push(
          watch(
            () => selector,
            () => updateViewDueToSelectorChange({}),
            {
              deep: true
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStateAndSelectorsNg<V extends new (...args: any[]) => any>(
    componentInstance: InstanceType<V>,
    subStateMap: { [key: string]: SubState },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectorMap: { [key: string]: ComputedRef<any> }
  ): void {
    this.useStateNg(componentInstance, subStateMap);
    this.useSelectorsNg(componentInstance, selectorMap);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStateNg<V extends new (...args: any[]) => any>(
    componentInstance: InstanceType<V>,
    subStateMap: { [key: string]: SubState }
  ): void {
    this.stateStopWatches.set(componentInstance, []);

    Object.entries(subStateMap).forEach(([stateName, subState]: [string, SubState]) => {
      if (!subState.__isSubState__) {
        throw new Error('useState: One of given subStates is not subState');
      }

      componentInstance[stateName] = subState;

      this.stateStopWatches.get(componentInstance).push(
        watch(
          () => subState,
          () => (componentInstance[stateName] = subState),
          {
            deep: true
          }
        )
      );
    });

    const originalOnDestroy = componentInstance.ngOnDestroy;
    componentInstance.ngOnDestroy = () => {
      this.stateStopWatches.get(componentInstance).forEach((stopWatch: StopHandle) => stopWatch());
      if (originalOnDestroy) {
        originalOnDestroy();
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelectorsNg<V extends new (...args: any) => any>(
    componentInstance: InstanceType<V>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectorMap: { [key: string]: ComputedRef<any> }
  ): void {
    this.selectorStopWatches.set(componentInstance, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(selectorMap).forEach(([selectorName, selector]: [string, ComputedRef<any>]) => {
      componentInstance[selectorName] = selector.value;

      this.selectorStopWatches.get(componentInstance).push(
        watch(
          () => selector,
          () => (componentInstance[selectorName] = selector.value),
          {
            deep: true
          }
        )
      );
    });

    const originalOnDestroy = componentInstance.ngOnDestroy;
    componentInstance.ngOnDestroy = () => {
      this.selectorStopWatches.get(componentInstance).forEach((stopWatch: StopHandle) => stopWatch());
      if (originalOnDestroy) {
        originalOnDestroy();
      }
    };
  }

  useStateSvelte(subStates: SubState[]): Writable<SubState>[] {
    const id = this.componentId++;
    this.stateStopWatches.set(id, []);
    this.stateWritables.set(id, []);

    subStates.forEach((subState: SubState, index: number) => {
      this.stateWritables.get(id).push(writable(subState));

      this.stateStopWatches.get(id).push(
        watch(
          () => subState,
          () => this.stateWritables.get(id)[index].set(subState),
          {
            deep: true
          }
        )
      );
    });

    onDestroy(() => this.stateStopWatches.get(id).forEach((stopWatch: StopHandle) => stopWatch()));

    return this.stateWritables.get(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelectorsSvelte(selectors: ComputedRef<any>[]): Writable<ComputedRef<any>>[] {
    const id = this.componentId++;
    this.stateStopWatches.set(id, []);
    this.stateWritables.set(id, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectors.forEach((selector: ComputedRef<any>, index: number) => {
      this.stateWritables.get(id).push(writable(selector.value));

      this.stateStopWatches.get(id).push(
        watch(
          () => selector,
          () => this.stateWritables.get(id)[index].set(selector.value),
          {
            deep: true
          }
        )
      );
    });

    onDestroy(() => this.stateStopWatches.get(id).forEach((stopWatch: StopHandle) => stopWatch()));

    return this.stateWritables.get(id);
  }
}
