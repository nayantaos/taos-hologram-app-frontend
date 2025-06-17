// src/hooks/use-model-preloader.ts
import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

export const useModelPreloader = (files: string[] | undefined) => {
  useEffect(() => {
    if (!files) return;
    files.forEach((file) => {
      useGLTF.preload(file);
    });
  }, [files]);
};
