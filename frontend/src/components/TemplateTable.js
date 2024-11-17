import React, { useState, useMemo } from "react";
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
  Button,
  Popover,
  FormControl,
  FormControlLabel,
  Checkbox,
  Stack,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  Pagination,
  IconButton,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SwapVertIcon from "@mui/icons-material/SwapVert";

import FilterListIcon from "@mui/icons-material/FilterList";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";

const TemplateTable = ({ transactions }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    category: "",
    status: {
      available: false,
      lowStock: false,
      unavailable: false,
    },
  });
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");

  const rowsPerPage = 10;
  const navigate = useNavigate();

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const open = Boolean(anchorEl);
  const id = open ? "filter-popover" : undefined;

  const categories = useMemo(() => {
    const uniqueCategories = new Set(transactions.map((t) => t.category));
    return Array.from(uniqueCategories);
  }, [transactions]);

  const handleStatusChange = (status) => {
    setFilters((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        [status]: !prev.status[status],
      },
    }));
  };

  const handleCategoryChange = (event) => {
    setFilters((prev) => ({
      ...prev,
      category: event.target.value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      status: {
        available: false,
        lowStock: false,
        unavailable: false,
      },
    });
  };

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      // Search filter
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch =
        transaction.product_name.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm);

      if (searchQuery && !matchesSearch) {
        return false;
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Status filter
      if (Object.values(filters.status).some((status) => status)) {
        const quantity = transaction.quantity;
        if (
          (filters.status.available && quantity > 10) ||
          (filters.status.lowStock && quantity > 0 && quantity <= 10) ||
          (filters.status.unavailable && quantity === 0)
        ) {
          return true;
        }
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  }, [transactions, filters, searchQuery, sortOrder]);

  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / rowsPerPage
  );

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    Object.values(filters.status).filter(Boolean).length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => `₱${Number(price).toFixed(2)}`;

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [filteredAndSortedTransactions, page, rowsPerPage]);

  return (
    <Box width={"100%"}>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, width: "100%" }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              size="small"
              value={filters.category}
              label="Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Status
          </Typography>
          <Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.status.available}
                  onChange={() => handleStatusChange("available")}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="success.main">
                  Available
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.status.lowStock}
                  onChange={() => handleStatusChange("lowStock")}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="warning.main">
                  Low Stock
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.status.unavailable}
                  onChange={() => handleStatusChange("unavailable")}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="error.main">
                  Unavailable
                </Typography>
              }
            />
          </Stack>
          {activeFiltersCount > 0 && (
            <Button
              fullWidth
              variant="contained"
              size="small"
              onClick={handleClearFilters}
              sx={{ mt: 2 }}
            >
              Clear All
            </Button>
          )}
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={handleClose}
            sx={{ mt: 1 }}
          >
            Done
          </Button>
        </Box>
      </Popover>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          mt: "10px",
          justifyContent: "flex-end",
        }}
      >
        <TextField
          size="small"
          placeholder="Search items..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            width: 250,
            "& .MuiOutlinedInput-root": {
              height: "32px",
            },
          }}
        />
        <Button
          onClick={toggleSortOrder}
          startIcon={<SwapVertIcon />}
          variant="outlined"
          size="small"
          sx={{ width: "120px" }}
        >
          Date {sortOrder === "asc" ? "↑" : "↓"}
        </Button>
        <Button
          onClick={handleClick}
          startIcon={<FilterListIcon />}
          variant="outlined"
          size="small"
          sx={{ width: "120px" }}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </Box>
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
        <TableContainer sx={{ height: "620px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  Item
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Category
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Quantity
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Price
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Date
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  VAT
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="500">
                        {transaction.product_name}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="500"
                        fontSize={"12px"}
                      >
                        SKU: {transaction.id}
                      </Typography>
                      {/* {transaction.description && (
                        <Typography
                          variant="body2"
                          fontSize={"12px"}
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {transaction.description}
                        </Typography>
                      )} */}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={transaction.category}
                      size="small"
                      sx={{
                        backgroundColor: "rgba(0, 147, 201, 0.1)",
                        color: "primary.main",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {transaction.quantity > 10 ? (
                        <Typography fontSize="10px" color="success.main">
                          Available
                        </Typography>
                      ) : transaction.quantity > 0 ? (
                        <Typography fontSize="10px" color="warning.main">
                          Low Stock
                        </Typography>
                      ) : (
                        <Typography fontSize="10px" color="error.main">
                          Unavailable
                        </Typography>
                      )}
                      <Box>{transaction.quantity}</Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {formatPrice(transaction.price)}
                  </TableCell>
                  <TableCell align="center">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      sx={{ fontSize: "11px" }}
                      label={transaction.vat ? "VAT" : "NON-VAT"}
                      size="small"
                      color={transaction.vat ? "primary" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/items/${transaction.id}`)}
                    >
                      <MoreHorizOutlinedIcon color="primary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length > 0 &&
                paginatedData.length < rowsPerPage && (
                  <TableRow>
                    <TableCell colSpan={12} sx={{ border: "none" }}>
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontStyle: "italic",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        Nothing follows
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              {filteredAndSortedTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} sx={{ border: "none" }}>
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontStyle: "italic",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        No items found <br />
                        (Check your filters)
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {filteredAndSortedTransactions.length > 0 && (
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
    </Box>
  );
};

export default TemplateTable;
