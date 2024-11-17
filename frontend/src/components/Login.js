import React, { useState } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "Cynthia" && password === "garchomp123!") {
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    } else {
      setError("Invalid username or password");
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: `
          linear-gradient(135deg, rgba(9, 89, 205, 0.9) 0%, rgba(92, 109, 235, 0.8) 100%),
          repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)
        `,
      }}
    >
      <Card
        sx={{
          p: 4,
          maxWidth: 400,
          width: "100%",
          m: 2,
          borderRadius: 2,
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <StoreRoundedIcon
            sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
          />
          <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
            Login to PokéMart Portal
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            required
            placeholder="Enter your username"
          />
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
            placeholder="Enter your password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    sx={{ color: "primary.main" }}
                  >
                    {showPassword ? (
                      <RemoveRedEyeOutlinedIcon size={20} />
                    ) : (
                      <VisibilityOffOutlinedIcon size={20} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{
              height: "42px",
              textTransform: "none",
              fontSize: "16px",
            }}
          >
            Sign In
          </Button>
        </form>

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Test Credentials: Cynthia / garchomp123!
        </Typography>
      </Card>
    </Box>
  );
};

export default Login;
