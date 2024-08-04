"use client";

import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
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
  Stack,
  IconButton,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
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
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await deleteDoc(docRef);
      updateInventory(); // To refresh the inventory after removing an item
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
      padding={0} // Added to remove extra padding
      margin={0} // Added to remove extra margin
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between" // Changed to position items
        alignItems="center"
        padding={2}
        bgcolor="#6f42c1"
        boxShadow={2}
        margin={0} // Added to remove extra margin
      >
        <Typography variant="h4" color="white" fontWeight="bold">
          Pantry Tracker
        </Typography>
        <Button variant="contained" onClick={handleOpen}>
          Add / Remove Item
        </Button>
      </Box>

      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="background.paper"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{ transform: "translate(-50%,-50%)" }}
        >
          <Typography variant="h6" color="textPrimary" align="center">
            Add or Remove Item
          </Typography>
          <TextField
            label="Item Name"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                addItem(itemName);
                setItemName("");
                handleClose();
              }}
            >
              Add Item
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                removeWholeItem(itemName);
                setItemName("");
                handleClose();
              }}
            >
              Remove Item
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Box width="100%" display="flex" justifyContent="center" padding={2}>
        <TextField
          label="Search Items"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ bgcolor: "white", width: "60%" }} // Adjust width as needed
        />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        width="100%"
        overflow="auto"
        padding={0} // Added to remove extra padding
        margin={0} // Added to remove extra margin
      >
        <Grid container spacing={2} padding={2}>
          {filteredInventory.map(({ name, quantity }) => (
            <Grid item xs={12} sm={6} md={6} lg={6} key={name}>
              <Card variant="outlined">
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
    </Box>
  );
}
