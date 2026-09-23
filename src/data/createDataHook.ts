import { useEffect, useState } from 'react'
import { useLocale } from '../i18n/locale'

export const createDataHook = <T extends unknown>(
    filename: string,
    defaultData: T,
) => {
    return () => {
        const [data, setData] = useState(defaultData)
        const { locale } = useLocale()

        useEffect(() => {
            ;(async () => {
                const res = await fetch(`/api/storage/${locale}/${filename}`)

                setData(await res.json())
            })()
        }, [locale])

        return data
    }
}
