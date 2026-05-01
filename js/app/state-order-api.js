import {
  addOrderRowAction,
  deleteOrderCellAction,
  deleteOrderRowAction,
  findOrderRowAction,
  getOrderCellAction,
  updateOrderCellAction,
  updateOrderRowFieldAction,
  updateRowCheckAction
} from '../orders/order-actions.js'

export function createStateOrderApi({ createActionContext }) {
  function addOrderRow() {
    return addOrderRowAction(createActionContext())
  }

  function deleteOrderRow(rowId) {
    return deleteOrderRowAction(createActionContext(), rowId)
  }

  function updateOrderRowField(rowId, field, value) {
    return updateOrderRowFieldAction(createActionContext(), rowId, field, value)
  }

  function updateOrderCell(rowId, productName, value) {
    return updateOrderCellAction(createActionContext(), rowId, productName, value)
  }

  function deleteOrderCell(rowId, productName) {
    return deleteOrderCellAction(createActionContext(), rowId, productName)
  }

  function updateRowCheck(rowId, checkType, checked) {
    return updateRowCheckAction(createActionContext(), rowId, checkType, checked)
  }

  function findOrderRow(rowId) {
    return findOrderRowAction(createActionContext(), rowId)
  }

  function getOrderCell(rowId, productName) {
    return getOrderCellAction(createActionContext(), rowId, productName)
  }

  return {
    addOrderRow,
    deleteOrderRow,
    updateOrderRowField,
    updateOrderCell,
    deleteOrderCell,
    updateRowCheck,
    findOrderRow,
    getOrderCell
  }
}
