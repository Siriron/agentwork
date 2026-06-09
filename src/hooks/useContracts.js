import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, TASK_REGISTRY_ABI, ERC20_ABI, REPUTATION_ORACLE_ABI } from '../lib/contracts'

const TR = CONTRACTS.TASK_REGISTRY
const RO = CONTRACTS.REPUTATION_ORACLE

// ─── Read ─────────────────────────────────────────────────────────────────────

export const useTaskCount = () =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'taskCount' })

export const useTaskCore = (id) =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'getTaskCore', args: [BigInt(id||0)], query: { enabled: !!id } })

export const useTaskMeta = (id) =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'getTaskMeta', args: [BigInt(id||0)], query: { enabled: !!id } })

export const useTaskBids = (id) =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'getTaskBids', args: [BigInt(id||0)], query: { enabled: !!id } })

export const useOpenTaskIds = (offset=0, limit=50) =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'getOpenTaskIds', args: [BigInt(offset), BigInt(limit)] })

export const usePosterTasks = (addr) =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'getPosterTasks', args: [addr], query: { enabled: !!addr } })

export const useAgentStats = (addr) =>
  useReadContract({ address: TR, abi: TASK_REGISTRY_ABI, functionName: 'getAgentStats', args: [addr], query: { enabled: !!addr } })

export const useUSDCBalance = (addr) =>
  useReadContract({ address: CONTRACTS.USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [addr], query: { enabled: !!addr } })

export const useUSDCAllowance = (owner) =>
  useReadContract({ address: CONTRACTS.USDC, abi: ERC20_ABI, functionName: 'allowance', args: [owner, TR], query: { enabled: !!owner } })

export const useRepScore = (addr) =>
  useReadContract({ address: RO, abi: REPUTATION_ORACLE_ABI, functionName: 'getScore', args: [addr], query: { enabled: !!addr } })

export const useRepStats = (addr) =>
  useReadContract({ address: RO, abi: REPUTATION_ORACLE_ABI, functionName: 'getStats', args: [addr], query: { enabled: !!addr } })

export const useRepHistory = (addr) =>
  useReadContract({ address: RO, abi: REPUTATION_ORACLE_ABI, functionName: 'getHistory', args: [addr], query: { enabled: !!addr } })

// ─── Write factory ────────────────────────────────────────────────────────────

function useWrite(functionName, address = TR, abi = TASK_REGISTRY_ABI) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const write = (args) => writeContract({ address, abi, functionName, args })
  return { write, hash, isPending, isConfirming, isSuccess, error, reset }
}

export const useApproveUSDC = () => {
  const w = useWrite('approve', CONTRACTS.USDC, ERC20_ABI)
  return {
    ...w,
    approve: (amountUSDC) => w.write([TR, parseUnits(String(amountUSDC), 6)])
  }
}

export const usePostTask = () => {
  const w = useWrite('postTask')
  return {
    ...w,
    postTask: ({ title, description, category, bounty, deadline }) =>
      w.write([title, description, category, parseUnits(String(bounty), 6), BigInt(Math.floor(new Date(deadline).getTime() / 1000))])
  }
}

export const useBidOnTask = () => {
  const w = useWrite('bidOnTask')
  return { ...w, bid: ({ taskId, proposal }) => w.write([BigInt(taskId), proposal]) }
}

export const useAssignTask = () => {
  const w = useWrite('assignTask')
  return { ...w, assign: ({ taskId, bidIndex }) => w.write([BigInt(taskId), BigInt(bidIndex)]) }
}

export const useSubmitWork = () => {
  const w = useWrite('submitWork')
  return { ...w, submit: ({ taskId, deliverableHash }) => w.write([BigInt(taskId), deliverableHash]) }
}

export const useAttestCompletion = () => {
  const w = useWrite('attestCompletion')
  return { ...w, attest: ({ taskId, rating }) => w.write([BigInt(taskId), rating]) }
}

export const useCancelTask = () => {
  const w = useWrite('cancelTask')
  return { ...w, cancel: (taskId) => w.write([BigInt(taskId)]) }
}

export const useDisputeTask = () => {
  const w = useWrite('disputeTask')
  return { ...w, dispute: (taskId) => w.write([BigInt(taskId)]) }
}
