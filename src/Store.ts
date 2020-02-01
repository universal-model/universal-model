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
  private viewToNeedsUpdateMap = new Map();
  private readonly componentInstanceToUpdatesMap = new Map();
  private readonly stateWritables = new Map();
  private readonly selectorWritables = new Map();
  private readonly idToUpdatesMap = new Map();

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
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      subStates.forEach((subState: SubState) => {
        if (!subState.__isSubState__) {
          throw new Error('useState: One of given subStates is not subState');
        }

        stopWatches.push(
          watch(
            () => subState,
            () => {
              if (!this.viewToNeedsUpdateMap.get(view)) {
                setTimeout(() => {
                  this.viewToNeedsUpdateMap.delete(view);
                  updateView({});
                }, 0);
              }

              this.viewToNeedsUpdateMap.set(view, true);
            },
            {
              deep: true,
              flush: 'sync'
            }
          )
        );
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectors.forEach((selector: any) => {
        stopWatches.push(
          watch(
            () => selector,
            () => {
              if (!this.viewToNeedsUpdateMap.get(view)) {
                setTimeout(() => {
                  this.viewToNeedsUpdateMap.delete(view);
                  updateView({});
                }, 0);
              }

              this.viewToNeedsUpdateMap.set(view, true);
            },
            {
              deep: true,
              flush: 'sync'
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  useStateReact(subStates: SubState[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      subStates.forEach((subState: SubState) => {
        if (!subState.__isSubState__) {
          throw new Error('useState: One of given subStates is not subState');
        }

        stopWatches.push(
          watch(
            () => subState,
            () => {
              if (!this.viewToNeedsUpdateMap.get(view)) {
                setTimeout(() => {
                  this.viewToNeedsUpdateMap.delete(view);
                  updateView({});
                }, 0);
              }

              this.viewToNeedsUpdateMap.set(view, true);
            },
            {
              deep: true,
              flush: 'sync'
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelectorsReact(selectors: ComputedRef<any>[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectors.forEach((selector: any) => {
        stopWatches.push(
          watch(
            () => selector,
            () => {
              if (!this.viewToNeedsUpdateMap.get(view)) {
                setTimeout(() => {
                  this.viewToNeedsUpdateMap.delete(view);
                  updateView({});
                }, 0);
              }

              this.viewToNeedsUpdateMap.set(view, true);
            },
            {
              deep: true,
              flush: 'sync'
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
          () => {
            if (!this.componentInstanceToUpdatesMap.get(componentInstance)) {
              setTimeout(() => {
                Object.entries(this.componentInstanceToUpdatesMap.get(componentInstance)).forEach(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ([key, value]: [string, any]) => {
                    console.log(key, value);
                    componentInstance[key] = value;
                  }
                );

                this.componentInstanceToUpdatesMap.delete(componentInstance);
              }, 0);
            }

            this.componentInstanceToUpdatesMap.set(componentInstance, {
              ...this.componentInstanceToUpdatesMap.get(componentInstance),
              [stateName]: subState
            });
          },
          {
            deep: true,
            flush: 'sync'
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
          () => {
            if (!this.componentInstanceToUpdatesMap.get(componentInstance)) {
              setTimeout(() => {
                Object.entries(this.componentInstanceToUpdatesMap.get(componentInstance)).forEach(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ([key, value]: [string, any]) => {
                    console.log(key, value);
                    componentInstance[key] = value;
                  }
                );

                this.componentInstanceToUpdatesMap.delete(componentInstance);
              }, 0);
            }

            this.componentInstanceToUpdatesMap.set(componentInstance, {
              ...this.componentInstanceToUpdatesMap.get(componentInstance),
              [selectorName]: selector.value
            });
          },
          {
            deep: true,
            flush: 'sync'
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

  useStateSvelte(id: string, subStates: SubState[]): Writable<SubState>[] {
    this.stateStopWatches.set(id, []);
    this.stateWritables.set(id, []);

    subStates.forEach((subState: SubState, index: number) => {
      this.stateWritables.get(id).push(writable(subState));

      this.stateStopWatches.get(id).push(
        watch(
          () => subState,
          () => {
            if (!this.idToUpdatesMap.get(id)) {
              setTimeout(() => {
                Object.entries(this.idToUpdatesMap.get(id)).forEach(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ([key, value]: [string, any]) => {
                    if (key.startsWith('state')) {
                      this.stateWritables.get(id)[parseInt(key.slice(5))].set(value);
                    } else {
                      this.selectorWritables.get(id)[parseInt(key.slice(8))].set(value);
                    }
                  }
                );

                this.idToUpdatesMap.delete(id);
              }, 0);
            }

            this.idToUpdatesMap.set(id, {
              ...this.idToUpdatesMap.get(id),
              [`state${index}`]: subState
            });
          },
          {
            deep: true,
            flush: 'sync'
          }
        )
      );
    });

    onDestroy(() => this.stateStopWatches.get(id).forEach((stopWatch: StopHandle) => stopWatch()));

    return this.stateWritables.get(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelectorsSvelte(id: string, selectors: ComputedRef<any>[]): Writable<ComputedRef<any>>[] {
    this.selectorStopWatches.set(id, []);
    this.selectorWritables.set(id, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectors.forEach((selector: ComputedRef<any>, index: number) => {
      this.selectorWritables.get(id).push(writable(selector.value));

      this.selectorStopWatches.get(id).push(
        watch(
          () => selector,
          () => {
            if (!this.idToUpdatesMap.get(id)) {
              setTimeout(() => {
                Object.entries(this.idToUpdatesMap.get(id)).forEach(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ([key, value]: [string, any]) => {
                    if (key.startsWith('state')) {
                      this.stateWritables.get(id)[parseInt(key.slice(5))].set(value);
                    } else {
                      this.selectorWritables.get(id)[parseInt(key.slice(8))].set(value);
                    }
                  }
                );

                this.idToUpdatesMap.delete(id);
              }, 0);
            }

            this.idToUpdatesMap.set(id, {
              ...this.idToUpdatesMap.get(id),
              [`selector${index}`]: selector.value
            });
          },
          {
            deep: true,
            flush: 'sync'
          }
        )
      );
    });

    onDestroy(() => this.selectorStopWatches.get(id).forEach((stopWatch: StopHandle) => stopWatch()));

    return this.selectorWritables.get(id);
  }
}
