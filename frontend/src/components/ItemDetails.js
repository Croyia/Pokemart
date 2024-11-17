import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useNavigate, useParams } from "react-router-dom";
import EditModal from "./EditModal";
import ConfirmationDialog from "./ConfirmationDialog";
import api from "../api";

const ItemDetails = ({ transactions, suppliers, onRefresh, showMessage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const item = transactions.find((t) => t.id === parseInt(id));
  const supplier = suppliers.find((s) => s.id === item?.supplier_id);

  if (!item) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Item not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const handleUpdateSubmit = async (updatedData) => {
    try {
      await api.put(`/transactions/${item.id}`, updatedData);
      onRefresh();
      setOpenEditModal(false);
      showMessage("Item successfully updated!", "success");
    } catch (error) {
      showMessage("Failed to update item. Please try again.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${item.id}`);
      onRefresh();
      setOpenConfirmDialog(false);
      navigate(-1);
      showMessage("Item successfully deleted!", "success");
    } catch (error) {
      showMessage("Failed to update item. Please try again.", "error");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => `₱${Number(price).toFixed(2)}`;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" color="primary" fontWeight={700}>
          Item Details
        </Typography>
      </Stack>

      <Card sx={{ p: 5 }}>
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {item.product_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stock Keeping Unit ID: {item.id}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setOpenEditModal(true)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineOutlinedIcon />}
                onClick={() => setOpenConfirmDialog(true)}
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box spacing={3}>
          <Grid
            container
            spacing={3}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Chip
                  label={item.category}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(0, 147, 201, 0.1)",
                    color: "primary.main",
                    mt: 1,
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Quantity
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {item.quantity}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Stock Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {item.quantity > 10 ? (
                    <Chip label="Available" size="small" color="success" />
                  ) : item.quantity > 0 ? (
                    <Chip label="Low Stock" size="small" color="warning" />
                  ) : (
                    <Chip label="Unavailable" size="small" color="error" />
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {formatPrice(item.price)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date Added
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {formatDate(item.date)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  VAT Status
                </Typography>
                <Chip
                  sx={{ mt: 1 }}
                  label={item.vat ? "VAT" : "NON-VAT"}
                  size="small"
                  color={item.vat ? "primary" : "success"}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>

          <Grid item size={6}>
            <Box mt={3}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Description
              </Typography>
              <Typography variant="body1">
                {item.description || "No description provided"}
              </Typography>
            </Box>
          </Grid>

          <Grid item size={6}>
            <Box mt={3}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Supplier Information
              </Typography>
              {supplier ? (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1" fontWeight={500}>
                    {supplier.supplier_name}
                  </Typography>
                  <Stack direction="row" spacing={3} mt={1}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <PersonOutlineIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        fontSize="12px"
                        color="text.secondary"
                      >
                        {supplier.supplier_contact_person}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <PhoneOutlinedIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        fontSize="12px"
                        color="text.secondary"
                      >
                        {supplier.supplier_contact_number}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  No supplier assigned
                </Typography>
              )}
            </Box>
          </Grid>
        </Box>
      </Card>

      <EditModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        item={item}
        onSubmit={handleUpdateSubmit}
        title="Edit PokéItem"
        suppliers={suppliers}
      />

      <ConfirmationDialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        onConfirm={handleDelete}
        item={item}
      />
    </Box>
  );
};

export default ItemDetails;
