import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, TASK_REGISTRY_ABI, ERC20_ABI } from '../lib/contracts'

// ─── Read Hooks ───────────────────────────────────────────────────────────────

export function useTaskCount() {
  return useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'taskCount',
  })
}

export function useTask(taskId) {
  return useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTask',
    args: [BigInt(taskId || 0)],
    enabled: !!taskId,
  })
}

export function useTaskBids(taskId) {
  return useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTaskBids',
    args: [BigInt(taskId || 0)],
    enabled: !!taskId,
  })
}

export function useOpenTasks(offset = 0, limit = 20) {
  return useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getOpenTasks',
    args: [BigInt(offset), BigInt(limit)],
  })
}

export function useAgentStats(address) {
  return useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getAgentStats',
    args: [address],
    enabled: !!address,
  })
}

export function usePosterTasks(address) {
  return useReadContract({
    address: CONTRACTS.TASK_REGISTRY,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getPosterTasks',
    args: [address],
    enabled: !!address,
  })
}

export function useUSDCBalance(address) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  })
}

export function useUSDCAllowance(owner) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, CONTRACTS.TASK_REGISTRY],
    enabled: !!owner,
  })
}

// ─── Write Hooks ──────────────────────────────────────────────────────────────

export function usePostTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const postTask = ({ title, description, category, bountyUSDC, deadline }) => {
    const bounty = parseUnits(bountyUSDC.toString(), 6)
    const deadlineTs = BigInt(Math.floor(new Date(deadline).getTime() / 1000))

    writeContract({
      address: CONTRACTS.TASK_REGISTRY,
      abi: TASK_REGISTRY_ABI,
      functionName: 'postTask',
      args: [title, description, category, bounty, deadlineTs],
    })
  }

  return { postTask, hash, isPending, isConfirming, isSuccess, error }
}

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (amountUSDC) => {
    const amount = parseUnits(amountUSDC.toString(), 6)
    writeContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.TASK_REGISTRY, amount],
    })
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error }
}

export function useBidOnTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const bid = ({ taskId, proposal }) => {
    writeContract({
      address: CONTRACTS.TASK_REGISTRY,
      abi: TASK_REGISTRY_ABI,
      functionName: 'bidOnTask',
      args: [BigInt(taskId), proposal],
    })
  }

  return { bid, hash, isPending, isConfirming, isSuccess, error }
}

export function useAssignTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const assign = ({ taskId, bidIndex }) => {
    writeContract({
      address: CONTRACTS.TASK_REGISTRY,
      abi: TASK_REGISTRY_ABI,
      functionName: 'assignTask',
      args: [BigInt(taskId), BigInt(bidIndex)],
    })
  }

  return { assign, hash, isPending, isConfirming, isSuccess, error }
}

export function useSubmitWork() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const submit = ({ taskId, deliverableHash }) => {
    writeContract({
      address: CONTRACTS.TASK_REGISTRY,
      abi: TASK_REGISTRY_ABI,
      functionName: 'submitWork',
      args: [BigInt(taskId), deliverableHash],
    })
  }

  return { submit, hash, isPending, isConfirming, isSuccess, error }
}

export function useAttestCompletion() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const attest = ({ taskId, rating }) => {
    writeContract({
      address: CONTRACTS.TASK_REGISTRY,
      abi: TASK_REGISTRY_ABI,
      functionName: 'attestCompletion',
      args: [BigInt(taskId), rating],
    })
  }

  return { attest, hash, isPending, isConfirming, isSuccess, error }
}

export function useCancelTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancel = (taskId) => {
    writeContract({
      address: CONTRACTS.TASK_REGISTRY,
      abi: TASK_REGISTRY_ABI,
      functionName: 'cancelTask',
      args: [BigInt(taskId)],
    })
  }

  return { cancel, hash, isPending, isConfirming, isSuccess, error }
}
