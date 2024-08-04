"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import OpenAI from "openai";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { firestore } from "@/firebase";
import ReactMarkdown from "react-markdown";
import { Camera } from "react-camera-pro";

import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: This is not recommended for production use
});

const classifyImageWithAPI = async (base64Image) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What pantry item is in this image? If it's a pantry item typically found in a pantry, respond with just the name of the item. If it's not a typical pantry item or not a food item at all, respond with 'not pantry item'.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    console.log("OpenAI API Response:", response);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to classify image");
  }
};

const recipemodalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 600,
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemName, setItemName] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipe, setRecipe] = useState("");
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");
  const [facingMode, setFacingMode] = useState("user");
  const canvasRef = useRef(null);
  const camera = useRef(null);

  const updateInventory = async () => {
    try {
      const inventoryCollection = collection(firestore, "inventory");
      const snapshot = await getDocs(query(inventoryCollection));
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({
          name: doc.id,
          ...doc.data(),
        });
      });
      setInventory(inventoryList);
      console.log(inventoryList);
    } catch (error) {
      console.error("Error updating inventory: ", error);
    }
  };

  const flipCamera = () => {
    if (camera.current) {
      const newMode = camera.current.switchCamera();
      setFacingMode(newMode);
    }
  };
  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item.toLowerCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    updateInventory(); // To refresh the inventory after adding an item
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
      updateInventory(); // To refresh the inventory after removing an item
    }
  };

  const removeWholeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item.toLowerCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await deleteDoc(docRef);
      updateInventory(); // To refresh the inventory after removing an item
    } else {
      console.error("Item does not exist in the inventory.");
    }
  };

  const handleRemoveItem = () => {
    if (itemName.trim()) {
      removeWholeItem(itemName.trim());
      setItemName("");
      handleClose();
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemName("");
    setErrorMessage("");
  };

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (error) {
      console.error("Error accessing camera: ", error);
    }
  };

  const captureImage = async () => {
    setIsLoading(true); // Show loading indicator
    setIsClassifying(true);
    try {
      const imageSrc = camera.current.takePhoto();
      const base64Image = imageSrc.split(",")[1];
      await processImage(base64Image); // Process the captured image
      console.log("Sending image to OpenAI API...");
    } catch (error) {
      console.error("Error capturing image:", error);
      setErrorMessage("Failed to capture image. Please try again.");
    } finally {
      setIsLoading(false); // Hide loading indicator
      setIsClassifying(false);
      setCameraOpen(false);
    }
  };

  const processImage = async (base64Image) => {
    if (!base64Image) return;
    setIsClassifying(true);
    try {
      const detectedItem = await classifyImageWithAPI(base64Image);
      if (detectedItem !== "not pantry item") {
        await addItem(detectedItem);
      } else {
        setErrorMessage("The item detected is not a typical pantry item.");
      }
      handleClose();
    } catch (error) {
      console.error("Error processing image: ", error);
      setErrorMessage("Failed to classify image. Please try again.");
    } finally {
      setIsClassifying(false);
      setIsLoading(false); // Hide loading indicator
      setCameraOpen(false);
    }
  };

  const handleAddItem = () => {
    if (itemName.trim()) {
      addItem(itemName.trim());
      handleClose();
    }
  };

  const handleGetRecipe = async () => {
    setIsRecipeLoading(true);
    setRecipeOpen(true);

    try {
      const inventoryCollection = collection(firestore, "inventory");
      const snapshot = await getDocs(query(inventoryCollection));
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({
          name: doc.id,
          ...doc.data(),
        });
      });

      const pantryItems = inventoryList.map((item) => item.name).join(", ");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Here are the items in my pantry: ${pantryItems}. Can you suggest a recipe that I can cook with these items?`,
          },
        ],
        max_tokens: 500,
      });

      const recipe = response.choices[0].message.content.trim();
      setRecipe(recipe);
    } catch (error) {
      console.error("Error fetching recipe: ", error);
      setErrorMessage("Failed to fetch recipe. Please try again.");
    } finally {
      setIsRecipeLoading(false);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      bgcolor="orange"
      gap={2}
      padding={0}
      margin={0}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        padding={2}
        bgcolor="#6f42c1"
        boxShadow={2}
        margin={0}
      >
        <Typography variant="h4" color="white" fontWeight="bold">
          Pantry Tracker
        </Typography>
        <Box>
          <Button variant="contained" onClick={handleOpen} sx={{ mr: 2 }}>
            Add / Remove Item
          </Button>
          <Button
            variant="contained"
            onClick={handleGetRecipe}
            sx={{ bgcolor: "blue", "&:hover": { bgcolor: "darkblue" } }}
          >
            AI Recipe
          </Button>
        </Box>
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" align="center">
            Add or Remove Item
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            type="text"
            fullWidth
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleAddItem}
            sx={{
              mt: 2,
              bgcolor: "green",
              "&:hover": { bgcolor: "darkgreen" },
            }}
          >
            Add Item
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleRemoveItem}
            sx={{ mt: 2, bgcolor: "red", "&:hover": { bgcolor: "darkred" } }}
          >
            Remove Item
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={startCamera}
            sx={{
              mt: 2,
              color: "blue",
              borderColor: "blue",
              "&:hover": { borderColor: "darkblue", color: "darkblue" },
            }}
          >
            Add Item via Camera
          </Button>
          {errorMessage && (
            <Typography color="error" sx={{ mt: 1 }}>
              {errorMessage}
            </Typography>
          )}
        </Box>
      </Modal>

      <Modal open={cameraOpen} onClose={() => setCameraOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 660,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 2,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: "640px",
              height: "480px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: "black",
            }}
          >
            <Camera
              ref={camera}
              aspectRatio={1}
              facingMode={facingMode}
              numberOfCamerasCallback={(cameras) => {
                console.log("Number of cameras:", cameras);
              }}
            />
          </Box>
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
            width="640"
            height="480"
          />
          <Button
            fullWidth
            variant="outlined"
            onClick={flipCamera}
            sx={{ mt: 2, width: "640px" }}
          >
            Flip Camera
          </Button>
          {isLoading ? (
            <CircularProgress sx={{ mt: 2 }} />
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={captureImage}
              sx={{ mt: 2, width: "640px" }}
              startIcon={<CameraAltIcon />}
            >
              Capture and Analyze Image
            </Button>
          )}
          {errorMessage && (
            <Typography color="error" sx={{ mt: 1 }}>
              {errorMessage}
            </Typography>
          )}
        </Box>
      </Modal>

      <Modal open={recipeOpen} onClose={() => setRecipeOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" align="center">
            AI Generated Recipe
          </Typography>
          {isRecipeLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ overflowY: "auto", maxHeight: "70vh" }}>
              <ReactMarkdown>{recipe}</ReactMarkdown>
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            onClick={() => setRecipeOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>

      <Box width="100%" display="flex" justifyContent="center" padding={2}>
        <TextField
          label="Search Items"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ bgcolor: "white", width: "60%" }}
        />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        width="100%"
        overflow="auto"
        padding={0}
        margin={0}
      >
        <Grid container spacing={2} padding={2}>
          {filteredInventory.map(({ name, quantity }) => (
            <Grid item xs={12} sm={6} md={6} lg={6} key={name}>
              <Card
                variant="outlined"
                sx={{
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" color="textPrimary">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Quantity: {quantity}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton color="success" onClick={() => addItem(name)}>
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => removeItem(name)}>
                    <ArrowDownwardIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage("")}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
