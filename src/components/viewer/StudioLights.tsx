import { Environment, Lightformer } from '@react-three/drei'

const SCENE_CENTER: [number, number, number] = [0, 0.6, 0]

/**
 * Luz de estúdio gerada em código (sem baixar HDR): um painel grande no
 * alto, um quente de um lado, um neutro do outro e um de frente. Dá reflexo ao aço e
 * volume ao tecido sem custar rede.
 */
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3.2, 5, 2.4]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      {/* Contraluz: recorta a silhueta de móvel escuro contra o fundo escuro. */}
      <directionalLight position={[-2.5, 3.5, -4]} intensity={1.6} color="#ffe9cf" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 1]} scale={[8, 4, 1]} target={SCENE_CENTER} />
        <Lightformer form="rect" intensity={1.4} color="#ffe2b8" position={[-5, 2, 2]} scale={[4, 4, 1]} target={SCENE_CENTER} />
        <Lightformer form="rect" intensity={0.9} position={[5, 1.5, -3]} scale={[4, 4, 1]} target={SCENE_CENTER} />
        <Lightformer form="rect" intensity={1.1} position={[2, 2, 6]} scale={[6, 4, 1]} target={SCENE_CENTER} />
      </Environment>
    </>
  )
}
