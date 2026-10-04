import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import SplashScreen from '../components/SplashScreen'
import * as store from '../lib/store'
import {
  bindMembers,
  getSeedMembers,
  getJobType,
  getSpecialty,
  getMember as getMemberFromData,
  getMembersByJobType,
  getMembersBySpecialty,
  getFeaturedMembers,
  getSimilarMembers,
  getNewMembers,
  getCityGroups,
  getCityBySlug,
  getMembersInCity,
  getStateGroups,
  getStateByCode,
  isNewMember,
  getAllSpecialties,
  jobTypes,
} from '../data/network'

const NetworkContext = createContext(null)

export function NetworkProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [version, setVersion] = useState(0)
  const [storageMode, setStorageMode] = useState('local')
  const finishSplash = useCallback(() => setSplashDone(true), [])

  const refresh = useCallback(() => {
    const members = store.getStoredMembers()
    bindMembers(members)
    setStorageMode(store.getStorageMode())
    setVersion((v) => v + 1)
    return members
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const seed = getSeedMembers()
      await store.initStore(seed)
      if (cancelled) return
      refresh()
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const value = useMemo(() => {
    void version
    return {
      ready,
      refresh,
      storageMode,
      jobTypes,
      getAllSpecialties,
      getJobType,
      getSpecialty,
      getMember: getMemberFromData,
      getMembers: () => store.getStoredMembers(),
      getMembersByJobType,
      getMembersBySpecialty,
      getFeaturedMembers,
      getSimilarMembers,
      getNewMembers,
      getCityGroups,
      getCityBySlug,
      getMembersInCity,
      getStateGroups,
      getStateByCode,
      isNewMember,
      submitApplication: (data) => {
        const app = store.submitApplication(data)
        refresh()
        return app
      },
      saveContactRequest: (data) => {
        const contact = store.saveContactRequest(data)
        refresh()
        return contact
      },
      getApplications: store.getApplications,
      getApplication: store.getApplication,
      approveApplication: (id, specialtyName, overrides, options) => {
        const member = store.approveApplication(id, specialtyName, overrides, options)
        refresh()
        return member
      },
      rejectApplication: (id, reason) => {
        const app = store.rejectApplication(id, reason)
        refresh()
        return app
      },
      createMemberManual: (data) => {
        const member = store.createMemberManual(data)
        refresh()
        return member
      },
      updateMember: (id, patch) => {
        const member = store.updateMember(id, patch)
        refresh()
        return member
      },
      archiveMember: (id) => {
        const member = store.archiveMember(id)
        refresh()
        return member
      },
      moveMemberToTop: (id) => {
        const member = store.moveMemberToTop(id)
        refresh()
        return member
      },
      getContactRequests: store.getContactRequests,
      exportData: store.exportData,
      importData: (payload) => {
        store.importData(payload)
        refresh()
      },
      resetLocalCache: () => {
        store.resetLocalNetworkCache()
        window.location.reload()
      },
    }
  }, [ready, refresh, version, storageMode])

  return (
    <>
      {ready ? <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider> : null}
      {!splashDone ? <SplashScreen dataReady={ready} onFinished={finishSplash} /> : null}
    </>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
