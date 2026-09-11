import { useEffect, useState, useCallback, useRef } from 'react'
import { init, requestDeviceIdentifier, getHostLanguage, NimiqProvider, ErrorResponse } from '@nimiq/mini-app-sdk'

export interface UseNimiqState {
  isConnecting: boolean
  isReady: boolean
  isInsideNimiqPay: boolean
  error: string | null
  accounts: string[]
  currentAccount: string | null
  blockNumber: number | null
  consensus: boolean | null
  language: string
  deviceId: string | null
}

export function useNimiq() {
  const providerRef = useRef<NimiqProvider | null>(null)
  const [state, setState] = useState<UseNimiqState>({
    isConnecting: true,
    isReady: false,
    isInsideNimiqPay: false,
    error: null,
    accounts: [],
    currentAccount: null,
    blockNumber: null,
    consensus: null,
    language: getHostLanguage() || 'en',
    deviceId: null,
  })

  // Initialize Nimiq Mini App SDK on mount
  useEffect(() => {
    let isMounted = true

    async function initializeProvider() {
      try {
        // timeout after 6 seconds if not inside Nimiq Pay
        const provider = await init({ timeout: 6000 })
        if (!isMounted) return

        providerRef.current = provider

        // Fetch block number & consensus if available without prompt
        let blockNumber: number | null = null
        let consensus: boolean | null = null

        try {
          consensus = await provider.isConsensusEstablished()
          blockNumber = await provider.getBlockNumber()
        } catch {
          // Non-blocking query failure
        }

        setState(prev => ({
          ...prev,
          isConnecting: false,
          isReady: true,
          isInsideNimiqPay: true,
          consensus,
          blockNumber,
          error: null,
        }))
      } catch (err: unknown) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : String(err)
        setState(prev => ({
          ...prev,
          isConnecting: false,
          isReady: false,
          isInsideNimiqPay: false,
          error: `Provider initialization: ${message}. Running in browser mode.`,
        }))
      }
    }

    initializeProvider()

    return () => {
      isMounted = false
    }
  }, [])

  // Explicit user action to connect account
  const connectWallet = useCallback(async (): Promise<string[] | null> => {
    if (!providerRef.current) {
      // Browser demo fallback
      const mockAddress = 'NQ89 25E0 1EK6 1GS6 B12T 4T1C 5XV9 R7PY 0X7N'
      setState(prev => ({
        ...prev,
        accounts: [mockAddress],
        currentAccount: mockAddress,
        error: null,
      }))
      return [mockAddress]
    }

    try {
      setState(prev => ({ ...prev, error: null }))
      const res = await providerRef.current.listAccounts()

      if ('error' in res) {
        const errResp = res as ErrorResponse
        const errMsg = errResp.error.message || 'Permission denied by user.'
        setState(prev => ({ ...prev, error: errMsg }))
        return null
      }

      const accs = res as string[]
      if (accs.length > 0) {
        setState(prev => ({
          ...prev,
          accounts: accs,
          currentAccount: accs[0],
          error: null,
        }))
        return accs
      } else {
        setState(prev => ({ ...prev, error: 'No accounts returned from wallet.' }))
        return null
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setState(prev => ({ ...prev, error: message }))
      return null
    }
  }, [])

  // Disconnect from local state
  const disconnectWallet = useCallback(() => {
    setState(prev => ({
      ...prev,
      accounts: [],
      currentAccount: null,
    }))
  }, [])

  // Request per-origin device identifier for soft rate-limiting
  const fetchDeviceId = useCallback(async (reason: string): Promise<string | null> => {
    try {
      const id = await requestDeviceIdentifier({ reason })
      setState(prev => ({ ...prev, deviceId: id }))
      return id
    } catch (err: unknown) {
      // Fallback for browsers or user denial
      console.warn('Could not retrieve Nimiq device identifier:', err)
      const localId = localStorage.getItem('tib_device_id') || `fallback_${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem('tib_device_id', localId)
      setState(prev => ({ ...prev, deviceId: localId }))
      return localId
    }
  }, [])

  // Send backing transaction with data tag
  const sendBackingTransaction = useCallback(async (params: {
    recipient: string
    valueLuna: number
    topicId: string
    explainerId: string
    feeLuna?: number
  }): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    const dataTag = `back:${params.topicId}:${params.explainerId}`

    if (!providerRef.current) {
      // If outside Nimiq Pay in local browser test, simulate success
      console.warn('Running outside Nimiq Pay. Simulating transaction with tag:', dataTag)
      const mockHash = `mock_tx_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`
      return { success: true, txHash: mockHash }
    }

    try {
      const res = await providerRef.current.sendBasicTransactionWithData({
        recipient: params.recipient,
        value: params.valueLuna,
        data: dataTag,
        fee: params.feeLuna || 0,
      })

      if (typeof res === 'object' && 'error' in res) {
        const errResp = res as ErrorResponse
        return {
          success: false,
          error: errResp.error.message || 'Transaction rejected by user.',
        }
      }

      return {
        success: true,
        txHash: res as string,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        error: message,
      }
    }
  }, [])

  return {
    ...state,
    provider: providerRef.current,
    connectWallet,
    disconnectWallet,
    fetchDeviceId,
    sendBackingTransaction,
  }
}
