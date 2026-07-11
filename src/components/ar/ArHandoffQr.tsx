import { useEffect, useRef, useState } from 'react'

interface ArHandoffQrProps {
  readonly url: string
}

const QR_SIZE_PX = 132

/**
 * QR de handoff: quem chega pelo desktop (ou por navegador sem AR) escaneia
 * e abre no celular exatamente com o móvel e as medidas configuradas.
 */
export function ArHandoffQr({ url }: ArHandoffQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const draw = async (): Promise<void> => {
      try {
        const { toCanvas } = await import('qrcode')
        if (isCancelled || canvasRef.current === null) return

        await toCanvas(canvasRef.current, url, {
          width: QR_SIZE_PX,
          margin: 1,
          color: { dark: '#0e1420', light: '#f4f6fb' },
        })
      } catch (error: unknown) {
        console.error('Falha ao gerar o QR code', error)
        if (!isCancelled) setHasFailed(true)
      }
    }

    void draw()
    return () => {
      isCancelled = true
    }
  }, [url])

  if (hasFailed) return null

  return (
    <canvas
      ref={canvasRef}
      className="ar-qr"
      role="img"
      aria-label="QR code — abra esta configuração no celular"
    />
  )
}
