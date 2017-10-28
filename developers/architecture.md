
`Base`: A base implementation, give a common implementation structure, no directly usage
`Controllers`: An event handlers, also a renderer (View)
`Delegates`: A main logic, responsible for interaction between controllers and core (ViewModel)
`Core`: An abstract model and logic (Model)

```
 ________ ------------- Base -------------
| VSCode | Controllers | Delegates | Core |
 -----------------------------------------
| ** extension starts from `guides.ts` ** |
|                                         |
|      events      delegate    utilise    |
|   o --------> o ---------> o ------> o  |
|                                         |
 -----------------------------------------
```
