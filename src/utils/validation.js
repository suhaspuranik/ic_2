/**
 * Validation utility functions that follow the Single Responsibility Principle
 * Each function is only responsible for validating a specific type of data
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
export const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// Required field validation
export const isRequired = (value) => {
  return value !== undefined && value !== null && value.trim() !== '';
};

// Min length validation
export const minLength = (value, min) => {
  return value && value.length >= min;
};

// Max length validation
export const maxLength = (value, max) => {
  return value && value.length <= max;
};

// Phone number validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Date validation (YYYY-MM-DD format)
export const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};