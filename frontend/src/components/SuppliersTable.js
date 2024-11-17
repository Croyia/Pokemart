import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Chip,
  Pagination,
  TextField,
  Button,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AddIcon from "@mui/icons-material/Add";
import TemplateModal from "./TemplateModal";
import SupplierForm from "./SupplierForm";
import api from "../api";

const SuppliersTable = ({
  suppliers = [],
  transactions = [],
  onRefresh = () => {},
  showMessage,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const rowsPerPage = 5;

  const handleOpenModal = (supplier = null) => {
    setEditingSupplier(supplier);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setEditingSupplier(null);
    setOpenModal(false);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, values);
        showMessage("Supplier successfully updated!", "success");
      } else {
        await api.post("/suppliers", values);
        showMessage("Supplier successfully added!", "success");
      }
      await onRefresh();
      handleCloseModal();
    } catch (error) {
      showMessage(
        `Failed to ${
          editingSupplier ? "update" : "add"
        } supplier. Please try again.`,
        "error"
      );
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getSupplierTransactionCount = (supplierId) => {
    return transactions.filter(
      (transaction) => transaction.supplier_id === supplierId
    ).length;
  };

  const sortedAndFilteredSuppliers = useMemo(() => {
    const filtered = suppliers.filter((supplier) => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        supplier.supplier_name.toLowerCase().includes(searchTerm) ||
        supplier.supplier_contact_person.toLowerCase().includes(searchTerm) ||
        supplier.supplier_contact_number.toLowerCase().includes(searchTerm)
      );
    });

    return filtered.sort((a, b) => {
      const countA = getSupplierTransactionCount(a.id);
      const countB = getSupplierTransactionCount(b.id);
      return countB - countA;
    });
  }, [suppliers, transactions, searchQuery]);

  const totalPages = Math.ceil(sortedAndFilteredSuppliers.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const paginatedSuppliers = sortedAndFilteredSuppliers.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <>
      <Card
        sx={{
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          borderRadius: 2,
          overflow: "hidden",
          width: "100%",
          marginTop: "20px",
          marginBottom: "30px",
        }}
      >
        <Box
          sx={{
            py: 1.5,
            px: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: "600",
              fontSize: "1rem",
            }}
          >
            Suppliers
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                width: 180,
                "& .MuiInputBase-root": {
                  height: "32px",
                  bgcolor: "white",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                },
                "& .MuiInputBase-input": {
                  padding: "4px 8px",
                },
              }}
            />
            <IconButton
              onClick={() => handleOpenModal()}
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                },
                padding: "4px",
              }}
            >
              <AddIcon sx={{ color: "white", fontSize: "1.25rem" }} />
            </IconButton>
          </Box>
        </Box>
        <TableContainer
          sx={{
            height: "393px",
            "& .MuiTableHead-root": {
              "& .MuiTableCell-root": {
                py: 1.5,
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  Supplier
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Items
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSuppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                      cursor: "pointer",
                    },
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => handleOpenModal(supplier)}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="500">
                        {supplier.supplier_name}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
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
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
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
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${getSupplierTransactionCount(
                        supplier.id
                      )} items`}
                      size="small"
                      sx={{
                        backgroundColor: "rgba(0, 147, 201, 0.1)",
                        color: "primary.main",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {paginatedSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} sx={{ border: "none" }}>
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontStyle: "italic",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        No suppliers found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      {sortedAndFilteredSuppliers.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            padding: "20px",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="medium"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <TemplateModal
        open={openModal}
        onClose={handleCloseModal}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
      >
        <SupplierForm
          isEdit={!!editingSupplier}
          initialData={editingSupplier}
          handleFormSubmit={handleFormSubmit}
          onSubmit={handleFormSubmit}
        />
      </TemplateModal>
    </>
  );
};

export default SuppliersTable;
