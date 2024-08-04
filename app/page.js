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
  Stack,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

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
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        padding={2}
        bgcolor="#6f42c1"
        boxShadow={2}
      >
        <Typography variant="h4" color="white" fontWeight="bold">
          Pantry Tracker
        </Typography>
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
            Add New Item
          </Typography>
          <TextField
            label="Item Name"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
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
        </Box>
      </Modal>
      <Box>
        <TextField
          label="Search Items"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ bgcolor: "white", margin: 2 }}
        />
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        width="62%"
        bgcolor="#6f42c1"
        padding={2}
      >
        <Typography variant="h2" color="white">
          Inventory Items
        </Typography>
        <Button variant="contained" onClick={handleOpen} sx={{ marginLeft: 2 }}>
          Add New Item
        </Button>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        border="1px solid #333"
        width="800px"
        overflow="auto"
        marginLeft={2}
      >
        <Stack width="100%" spacing={2} padding={2}>
          {filteredInventory.map(({ name, quantity }) => (
            <Card key={name} variant="outlined" sx={{ margin: 2, padding: 2 }}>
              <CardContent>
                <Typography variant="h5" color="textPrimary">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Quantity: {quantity}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => addItem(name)}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => removeItem(name)}
                >
                  Remove
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
