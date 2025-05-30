import { useBabylonStore } from "@/stores/babylonStore.ts";
import type {
  MugColor,
  MugMaterial,
  MugSize,
  MugTexture,
  MugType,
} from "@/types/types.ts";
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  ImportMeshAsync,
  Layer,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/loaders/glTF";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface BabylonPreviewProps {
  selectedMugType: MugType | null;
  selectedMugSize: MugSize | null;
  selectedMugColor: MugColor | null;
  selectedMugMaterial: MugMaterial | null;
  selectedMugTexture: MugTexture | null;
  selectedMugImage: string | null;
}

export const BabylonPreview = ({
  selectedMugType,
  selectedMugSize,
  selectedMugColor,
  selectedMugMaterial,
  selectedMugTexture,
  selectedMugImage,
}: BabylonPreviewProps) => {
  // Ottiene i dettagli dell'anteprima dallo store Zustand.
  const setCamera = useBabylonStore((state) => state.setCamera);
  const setScene = useBabylonStore((state) => state.setScene);
  const setEngine = useBabylonStore((state) => state.setEngine);

  // Impostazione dei Ref e degli State del canvas.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;
  const [borderAnimated, setBorderAnimated] = useState(false);
  // Impostazione dei Ref di Babylon.
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const scene = sceneRef.current;
  const meshesRef = useRef<AbstractMesh[] | null>(null);
  const meshes = meshesRef.current;
  const materialRef = useRef<PBRMaterial | null>(null);
  const material = materialRef.current;
  const normalizationScaleRef = useRef(1);

  // Inizializzazione scena
  useEffect(() => {
    if (!canvas) return;

    // Creazione engine.
    const engine = new Engine(canvasRef.current, true, {
      antialias: true,
      stencil: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });

    engineRef.current = engine;
    setEngine(engine);

    // Creazione scena.
    const scene = new Scene(engine);
    sceneRef.current = scene;
    setScene(scene);

    // Colore sfondo della scena.
    scene.clearColor = new Color4(0.95, 0.95, 0.95, 1);

    // Immagine di sfondo della scena.
    const background = new Layer("bg", "images/sfondoBlur.jpg", scene, true);
    background.isBackground = true;
    background.texture!.level = 0;

    // Creazione camera.
    const camera = new ArcRotateCamera(
      "camera",
      0,
      Math.PI / 3,
      15,
      Vector3.Zero(),
      scene,
    );

    setCamera(camera);

    // Impostazioni camera.
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 8;
    camera.lowerBetaLimit = 0.01;

    // Creazione luci.
    new HemisphericLight("light", new Vector3(0, 1, 0), scene).intensity = 0.7;
    new HemisphericLight("light2", new Vector3(0, -1, 0), scene).intensity =
      0.5;
    new HemisphericLight("light3", new Vector3(10, 0, 0), scene).intensity =
      0.3;
    new HemisphericLight("light4", new Vector3(-10, 0, 0), scene).intensity =
      0.3;

    // Creazione materiale.
    const mat = new PBRMaterial("mugPBRMat", sceneRef.current);

    materialRef.current = mat;

    // Re-render della scena.
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Ridimensionamento della scena.
    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, [canvas, setCamera, setEngine, setScene]);

  // Cambio tipo di tazza
  useEffect(() => {
    if (!scene || !selectedMugType) return;

    // Elimina dalla scena un modello.
    // Se meshRef.current esiste e non è un array vuoto...
    if (meshesRef.current && meshesRef.current.length > 0) {
      // Ottiene il mesh 'root'.
      const rootMesh = meshesRef.current[0].parent ?? meshesRef.current[0];
      // Elimina il mesh e tutti i suoi figli.
      rootMesh.dispose(false, true);
      // Invalidazione della ref.
      meshesRef.current = null;
    }

    // Importazione asincrona di un modello .glb locale.
    const loadModel = async () => {
      try {
        const result = await ImportMeshAsync(
          `models/${selectedMugType.fileName}.glb`,
          scene,
        );

        // Filtra tutti i mesh importati per rimuovere eventuali mesh non validi.
        const meshes = result.meshes.filter((m) => m != null);
        if (meshes.length === 0) return;

        // Imposta lo stesso materiale a tutte le mesh.
        meshes.forEach((mesh) => {
          mesh.material = materialRef.current;
        });

        if (meshes.length > 0) {
          // Calcola il bouding box della mesh.
          const boundingBox = meshes[0].getHierarchyBoundingVectors();

          // Clacola il centro del bounding box.
          const center = boundingBox.min.add(boundingBox.max).scale(0.5);

          // Ottiene la mesh principale.
          const mainMesh = meshes[0];

          if (mainMesh) {
            // Centra e ruota la mesh.
            mainMesh.position.subtractInPlace(center);
            mainMesh.rotation.y = Math.PI;
          }

          // Assegna una scala di default se l'utente non ne ha selezionata una.
          const scale = selectedMugSize ? selectedMugSize.scale : 1.0;

          // Trova la mesh principale.
          const rootMesh = result.meshes.find((m) => !m.parent);

          if (rootMesh) {
            // Applica la scala al mesh.
            rootMesh.scaling = new Vector3(scale, scale, scale);
          }

          // Calcola il raggio del bouding box
          const radius = boundingBox.max.subtract(boundingBox.min).length() / 2;

          // Recupera la camera attiva e aggiorna raggio e target.
          const camera = scene.activeCamera as ArcRotateCamera;
          camera.radius = radius * 3;
          camera.target = Vector3.Zero();
        }

        // Salva la mesh nel Ref.
        meshesRef.current = meshes;

        console.log(`Tipo selezionato: ${selectedMugType.fileName}`); // Debug

        // Animazione del canvas eseguita al cambio di tipo di tazza.
        setBorderAnimated(true);
        const timeout = setTimeout(() => setBorderAnimated(false), 300); // durata animazione 500ms

        return () => clearTimeout(timeout);
      } catch (error) {
        console.error("Errore durante il caricamento del modello:", error);
      }
    };

    loadModel();
  }, [meshes, scene, selectedMugSize, selectedMugType]);

  // Cambio colore della tazza
  useEffect(() => {
    if (!material || !selectedMugColor) return;

    try {
      // Imposta il colore utilizzando il colore selezionato.
      material.albedoColor = Color3.FromHexString(selectedMugColor.code);

      console.log(
        `Colore selezionato: ${selectedMugColor.name}`,
        selectedMugColor,
      ); // Debug
    } catch (error) {
      console.error("Errore durante il cambiamento del colore:", error); // Debug
    }
  }, [material, selectedMugColor]);

  // Cambio dimensione della tazza
  useEffect(() => {
    if (!meshes || !selectedMugSize) return;

    // Scala di normalizzazione base.
    const base = normalizationScaleRef.current;

    // Scala selezionata dall'utente.
    const userScale = selectedMugSize.scale;

    // Calcola la scala finale/
    const finalScale = base * userScale;

    try {
      // Applica la stessa scala a tutte le mesh.
      meshes.forEach((mesh) => {
        mesh.scaling = new Vector3(finalScale, finalScale, finalScale);
      });

      console.log("Applico scala finale:", finalScale); // Debug
    } catch (error) {
      console.error("Errore durante la scala utente:", error); // Debug
    }
  }, [meshes, selectedMugSize]);

  // Cambio materiale della tazza
  useEffect(() => {
    if (!selectedMugMaterial || !scene || !material) return;

    try {
      // Recupera le impostazioni del materiale dal "database".
      material.alpha = selectedMugMaterial.alpha;
      material.metallic = selectedMugMaterial.metallic;
      material.roughness = selectedMugMaterial.roughness;
      material.indexOfRefraction = selectedMugMaterial.indexOfRefraction;

      // Imposta il tipo di trasparenza in base al valore ritornato dal "database".
      if (selectedMugMaterial.transparencyMode === "opaque") {
        material.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
      } else if (selectedMugMaterial.transparencyMode === "alphablend") {
        material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
      }

      // Applica lo stesso materiale a tutte le mesh.
      if (meshes) {
        meshes.forEach((child) => {
          child.material = material;
        });
      }

      console.log(
        `Materiale selezionato: ${selectedMugMaterial.code}`,
        selectedMugMaterial, // Debug
      );
    } catch (error) {
      console.error("Errore durante il cambio del materiale:", error); // Debug
    }
  }, [material, meshes, scene, selectedMugMaterial]);

  // Cambio texture della tazza
  useEffect(() => {
    if (!scene || !material || !meshes) return;

    // Se non è selezionata una texture, rimuove la texture corrente.
    if (!selectedMugTexture) {
      material.albedoTexture = null;

      // Applica il materiale a tutte le mesh.
      meshes.forEach((mesh) => {
        mesh.material = material;
      });

      return;
    }

    try {
      // Crea una nuova texture a partire dall'immagine della texture.
      const texture = new Texture(
        `images/textures/${selectedMugTexture.fileName}.jpg`,
        scene,
      );

      // Impostazioni scala texture e canale alpha.
      texture.uScale = 1;
      texture.vScale = 1;
      texture.hasAlpha = false;

      // Assegna la nuova tetxure al materiale.
      material.albedoTexture = texture;

      // Applica il materiale a tutte le mesh.
      meshes.forEach((mesh) => {
        mesh.material = material;
      });

      console.log(
        `Texture selezionata: ${selectedMugTexture.name}`,
        selectedMugTexture, // Debug
      );
    } catch (error) {
      console.error("Errore durante il caricamento della texture:", error); // Debug
    }
  }, [material, meshes, scene, selectedMugTexture]);

  // Inserimento immagine
  useEffect(() => {
    if (!scene || !material || !selectedMugImage) return;

    try {
      // Crea una nuova Texture con l'immagine selezionata.
      const texture = new Texture(
        selectedMugImage,
        scene,
        false,
        false,
        Texture.TRILINEAR_SAMPLINGMODE,
      );

      // Impostazioni scala texture e canale alpha.
      texture.uScale = 1;
      texture.vScale = 1;
      texture.hasAlpha = true;

      // Applica l'immagine alla tazza.
      material.albedoTexture = texture;

      console.log("Immagine personalizzata applicata", selectedMugImage); // Debug
    } catch (error) {
      console.error("Errore durante il caricamento dell'immagine:", error); // Debug
    }
  }, [material, scene, selectedMugImage]);

  return (
    <canvas
      ref={canvasRef}
      className={clsx(
        "relative h-full w-full rounded-lg border transition-all duration-500 focus:outline focus:outline-[#C8B6A6]",
        {
          "shadow-glow scale-101 border-[#D6A77A]": borderAnimated,
          "scale-100": !borderAnimated,
        },
      )}
    ></canvas>
  );
};
