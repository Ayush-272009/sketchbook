import { useEffect, useRef } from "react";

function Board() {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    //when mounting
    canvas.width = canvas.innerWidth;
    canvas.height = canvas.innerHeight;
  }, []);
  return <canvas ref={canvasRef}></canvas>;
}

export default Board;
