import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  FormHelperText,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useFormik } from "formik";
import * as Yup from "yup";

const TemplateForm = ({
  isEdit = false,
  initialData = null,
  onSubmit,
  handleFormSubmit = null,
  suppliers,
}) => {
  const validationSchema = Yup.object({
    product_name: Yup.string()
      .required("Item name is required")
      .min(2, "Item name must be at least 2 characters")
      .max(50, "Item name must be less than 50 characters"),
    category: Yup.string().required("Category is required"),
    quantity: Yup.number()
      .required("Quantity is required")
      .min(0, "Quantity cannot be negative")
      .integer("Quantity must be a whole number"),
    price: Yup.number()
      .required("Price is required")
      .min(0, "Price cannot be negative")
      .test(
        "decimal",
        "Price can only have up to 2 decimal places",
        (value) => {
          if (!value) return true;
          return /^\d+(\.\d{0,2})?$/.test(value.toString());
        }
      ),
    description: Yup.string().max(
      500,
      "Description must be less than 500 characters"
    ),
    date: Yup.date().required("Date is required"),
    vat: Yup.boolean(),
    supplier_id: Yup.number().required("Supplier is required"),
  });

  const formik = useFormik({
    initialValues: isEdit
      ? initialData
      : {
          product_name: "",
          quantity: "",
          price: "",
          vat: false,
          category: "",
          description: "",
          date: "",
          supplier_id: "",
        },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      const formattedValues = {
        ...values,
        supplier_id: values.supplier_id || null,
      };

      if (isEdit) {
        onSubmit(formattedValues);
      } else {
        handleFormSubmit(formattedValues);
      }
    },
  });

  const categories = [
    "Poké Balls",
    "Healing Items",
    "Status Items",
    "Battle Items",
    "TMs & HMs",
    "Berries",
    "Key Items",
    "Evolution Items",
  ];

  console.log("Available suppliers:", suppliers);

  return (
    <Box width={"100%"}>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item size={6}>
            <TextField
              fullWidth
              label="Item Name"
              name="product_name"
              value={formik.values.product_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.product_name &&
                Boolean(formik.errors.product_name)
              }
              helperText={
                formik.touched.product_name && formik.errors.product_name
              }
              variant="outlined"
              placeholder="e.g., Ultra Ball"
            />
          </Grid>

          <Grid item size={6}>
            <FormControl
              fullWidth
              error={formik.touched.category && Boolean(formik.errors.category)}
            >
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formik.values.category}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.category && formik.errors.category && (
                <FormHelperText>{formik.errors.category}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item size={6}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formik.values.quantity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
              variant="outlined"
            />
          </Grid>

          <Grid item size={6}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
              variant="outlined"
            />
          </Grid>

          <Grid item size={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
              multiline
              rows={3}
              variant="outlined"
              placeholder="Add a description"
            />
          </Grid>

          <Grid item size={6}>
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.date && Boolean(formik.errors.date)}
              helperText={formik.touched.date && formik.errors.date}
              variant="outlined"
            />
          </Grid>

          <Grid item size={6}>
            <FormControl
              fullWidth
              error={
                formik.touched.supplier_id && Boolean(formik.errors.supplier_id)
              }
            >
              <InputLabel>Supplier</InputLabel>
              <Select
                name="supplier_id"
                value={formik.values.supplier_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Supplier"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.supplier_id && formik.errors.supplier_id && (
                <FormHelperText error>
                  {formik.errors.supplier_id}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item size={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="vat"
                  checked={formik.values.vat}
                  onChange={formik.handleChange}
                  color="primary"
                />
              }
              label="VAT Inclusive"
            />
          </Grid>

          <Grid item size={12}>
            <Box display={"flex"} justifyContent={"end"}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ width: "100px" }}
                disabled={!formik.isValid || formik.isSubmitting}
              >
                {isEdit ? "Update" : "Submit"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default TemplateForm;
