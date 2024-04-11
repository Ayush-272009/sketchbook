import { MENU_ITEMS } from "@/constants";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { actionItemClick } from "@/slice/menuSlice";
import { socket } from "@/socket";

function Board() {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const drawHistory = useRef([]);
  const historyPointer = useRef(0);
  const shouldDarw = useRef(false);
  const { activeMenuItem, actionMenuItem } = useSelector((state) => state.menu);
  const { color, size } = useSelector((state) => state.toolbox[activeMenuItem]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
      const URL = canvas.toDataURL(); // Corrected method name
      //console.log(URL);
      const anchor = document.createElement("a");
      anchor.href = URL;
      anchor.download = "sketch.jpg";
      anchor.click();
    } else if (
      actionMenuItem === MENU_ITEMS.UNDO ||
      actionMenuItem === MENU_ITEMS.REDO
    ) {
      if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO)
        historyPointer.current--;
      if (
        historyPointer.current < drawHistory.current.length - 1 &&
        actionMenuItem === MENU_ITEMS.REDO
      )
        historyPointer.current++;
      const imageData = drawHistory.current[historyPointer.current];
      context.putImageData(imageData, 0, 0);
    }
    dispatch(actionItemClick(null)); //esse hum changes krne ke baad image download kr skte hain
    console.log("actionMenuItem", actionMenuItem);
  }, [actionMenuItem, dispatch]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const changeConfig = (color, size) => {
      context.strokeStyle = color;
      context.lineWidth = size;
    };

    const handleChangeConfig = (config) => {
      changeConfig(config.color, config.size);
    };
    changeConfig(color, size);
    socket.on("changeConfig", handleChangeConfig);

    return () => {
      socket.off("changeConfig", handleChangeConfig);
    };

    //context.strokeStyle = color;
    //context.lineWidth = size;
  }, [color, size]);

  //Before browser paint
  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.fillStyle = "#ffffff"; // white color
    context.fillRect(0, 0, canvas.width, canvas.height);

    const beginPath = (x, y) => {
      context.beginPath();
      context.moveTo(x, y);
    };

    const drawLine = (x, y) => {
      context.lineTo(x, y);
      context.stroke();
    };

    const handleMouseDown = (e) => {
      //yeh mouse click ko bata ra hai
      shouldDarw.current = true;
      beginPath(e.clientX, e.clientY);
      socket.emit("beginPath", { x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
      if (!shouldDarw.current) return;
      drawLine(e.clientX, e.clientY);
      socket.emit("drawLine", { x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
      shouldDarw.current = false;
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current.push(imageData);
      historyPointer.current = drawHistory.current.length - 1;
    };

    const handleBeginPath = (path) => {
      console.log("path", path);
      beginPath(path.x, path.y);
    };

    const handledrawLine = (path) => {
      drawLine(path.x, path.y);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    // socket.on("connect", () => {
    //   console.log("client connected");
    // });
    socket.on("beginPath", handleBeginPath);
    socket.on("drawLine", handledrawLine);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);

      socket.off("beginPath", handleBeginPath);
      socket.off("drawLine", handledrawLine);
    };
  }, []);
  //console.log(color, size);

  return <canvas ref={canvasRef}></canvas>;
}

export default Board;
