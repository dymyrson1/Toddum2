export function createActionContext(deps) {
  return {
    state: deps.state,
    addLog: deps.addLog,
    persistState: deps.persistState,
    getCurrentRows: deps.getCurrentRows,
    getCurrentWeekId: deps.getCurrentWeekId,
    getCurrentWeekLabel: deps.getCurrentWeekLabel,
    getPackagingOptionsForProduct: deps.getPackagingOptionsForProduct,
    ensureCustomerExists: deps.ensureCustomerExists
  }
}