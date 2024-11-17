import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, AppBar, Typography, Toolbar, Button } from "@mui/material";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import api from "./api";
import Dashboard from "./components/Dashboard";
import ItemDetails from "./components/ItemDetails";
import { Snackbar, Alert } from "@mui/material";
import CreateItem from "./components/CreateItem";
import GlobalScrollbarStyles from "./components/GlobalScrollbarStyles";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
    });
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showMessage("Failed to fetch items. Please try again.", "error");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
      console.log("Fetched suppliers:", response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showMessage("Failed to fetch items. Please try again.", "error");
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchSuppliers();
  }, []);

  return (
    <BrowserRouter>
      <GlobalScrollbarStyles />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                  <Toolbar
                    sx={{
                      gap: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      sx={{
                        gap: "10px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <StoreRoundedIcon
                        sx={{
                          fontSize: 40,
                        }}
                      />
                      <Typography variant="h5">Pokémart Portal</Typography>
                    </Box>

                    <Button
                      onClick={() => {
                        localStorage.removeItem("isLoggedIn");
                        window.location.href = "/login";
                      }}
                      sx={{ color: "white" }}
                    >
                      Logout
                    </Button>
                  </Toolbar>
                </AppBar>

                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={5000}
                  onClose={handleCloseSnackbar}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                  <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                      minWidth: "250px",
                      alignItems: "center",
                      ...(snackbar.severity === "success" && {
                        backgroundColor: "success.main",
                      }),
                      ...(snackbar.severity === "error" && {
                        backgroundColor: "error.main",
                      }),
                    }}
                  >
                    {snackbar.message}
                  </Alert>
                </Snackbar>

                <Routes>
                  <Route
                    path="/"
                    element={
                      <Dashboard
                        transactions={transactions}
                        suppliers={suppliers}
                        onRefresh={() => {
                          fetchTransactions();
                          fetchSuppliers();
                        }}
                        showMessage={showMessage}
                      />
                    }
                  />
                  <Route
                    path="/items/:id"
                    element={
                      <ItemDetails
                        transactions={transactions}
                        suppliers={suppliers}
                        onRefresh={() => {
                          fetchTransactions();
                          fetchSuppliers();
                        }}
                        showMessage={showMessage}
                      />
                    }
                  />
                  <Route
                    path="/create-item"
                    element={
                      <CreateItem
                        onRefresh={fetchTransactions}
                        showMessage={showMessage}
                        suppliers={suppliers}
                      />
                    }
                  />
                </Routes>
              </Box>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
