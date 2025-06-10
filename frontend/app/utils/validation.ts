/**
 * Validation Utilities - Reusable validation functions and schemas
 */

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export type Validator<T = any> = (value: T) => ValidationResult;

/**
 * Basic validation functions
 */
export const validators = {
  required: (message = 'This field is required'): Validator<any> => (value) => ({
    isValid: value !== undefined && value !== null && value !== '',
    error: !value ? message : undefined
  }),

  minLength: (min: number, message?: string): Validator<string> => (value) => ({
    isValid: !value || value.length >= min,
    error: value && value.length < min ? (message || `Must be at least ${min} characters`) : undefined
  }),

  maxLength: (max: number, message?: string): Validator<string> => (value) => ({
    isValid: !value || value.length <= max,
    error: value && value.length > max ? (message || `Must be ${max} characters or less`) : undefined
  }),

  email: (message = 'Invalid email address'): Validator<string> => (value) => {
    if (!value) return { isValid: true };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      error: !emailRegex.test(value) ? message : undefined
    };
  },

  url: (message = 'Invalid URL'): Validator<string> => (value) => {
    if (!value) return { isValid: true };
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: message };
    }
  },

  pattern: (regex: RegExp, message = 'Invalid format'): Validator<string> => (value) => ({
    isValid: !value || regex.test(value),
    error: value && !regex.test(value) ? message : undefined
  }),

  numeric: (message = 'Must be a number'): Validator<string | number> => (value) => {
    if (!value) return { isValid: true };
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return {
      isValid: !isNaN(num) && isFinite(num),
      error: isNaN(num) || !isFinite(num) ? message : undefined
    };
  },

  integer: (message = 'Must be a whole number'): Validator<string | number> => (value) => {
    if (!value) return { isValid: true };
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return {
      isValid: Number.isInteger(num),
      error: !Number.isInteger(num) ? message : undefined
    };
  },

  min: (minimum: number, message?: string): Validator<number> => (value) => ({
    isValid: value >= minimum,
    error: value < minimum ? (message || `Must be at least ${minimum}`) : undefined
  }),

  max: (maximum: number, message?: string): Validator<number> => (value) => ({
    isValid: value <= maximum,
    error: value > maximum ? (message || `Must be ${maximum} or less`) : undefined
  }),

  range: (min: number, max: number, message?: string): Validator<number> => (value) => ({
    isValid: value >= min && value <= max,
    error: (value < min || value > max) ? (message || `Must be between ${min} and ${max}`) : undefined
  }),

  oneOf: <T>(options: T[], message?: string): Validator<T> => (value) => ({
    isValid: options.includes(value),
    error: !options.includes(value) ? (message || `Must be one of: ${options.join(', ')}`) : undefined
  }),

  arrayMinLength: (min: number, message?: string): Validator<any[]> => (value) => ({
    isValid: Array.isArray(value) && value.length >= min,
    error: !Array.isArray(value) || value.length < min ? (message || `Must select at least ${min} item${min !== 1 ? 's' : ''}`) : undefined
  }),

  arrayMaxLength: (max: number, message?: string): Validator<any[]> => (value) => ({
    isValid: Array.isArray(value) && value.length <= max,
    error: !Array.isArray(value) || value.length > max ? (message || `Must select ${max} item${max !== 1 ? 's' : ''} or less`) : undefined
  }),

  custom: <T>(validateFn: (value: T) => boolean, message: string): Validator<T> => (value) => ({
    isValid: validateFn(value),
    error: !validateFn(value) ? message : undefined
  })
};

/**
 * Combine multiple validators
 */
export function combineValidators<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}

/**
 * File validation utilities
 */
export const fileValidators = {
  fileType: (allowedTypes: string[], message?: string): Validator<File> => (file) => {
    if (!file) return { isValid: true };
    const isValid = allowedTypes.includes(file.type);
    return {
      isValid,
      error: !isValid ? (message || `File type must be one of: ${allowedTypes.join(', ')}`) : undefined
    };
  },

  fileSize: (maxSizeBytes: number, message?: string): Validator<File> => (file) => {
    if (!file) return { isValid: true };
    const isValid = file.size <= maxSizeBytes;
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid,
      error: !isValid ? (message || `File size must be ${maxSizeMB}MB or less`) : undefined
    };
  },

  imageFile: (message = 'Must be an image file'): Validator<File> => (file) => {
    if (!file) return { isValid: true };
    const isValid = file.type.startsWith('image/');
    return {
      isValid,
      error: !isValid ? message : undefined
    };
  }
};

/**
 * Character-specific validators
 */
export const characterValidators = {
  name: combineValidators(
    validators.required('Character name is required'),
    validators.minLength(2, 'Name must be at least 2 characters'),
    validators.maxLength(50, 'Name must be 50 characters or less')
  ),

  archetype: validators.required('Please select a character archetype'),

  chatbotRole: validators.required('Please select a chatbot role'),

  description: validators.maxLength(500, 'Description must be 500 characters or less'),

  traits: combineValidators(
    validators.arrayMinLength(1, 'Please select at least one personality trait'),
    validators.arrayMaxLength(6, 'Please select no more than 6 traits')
  ),

  colors: validators.arrayMaxLength(5, 'Please select no more than 5 colors'),

  avatar: combineValidators(
    fileValidators.imageFile(),
    fileValidators.fileSize(5 * 1024 * 1024, 'Avatar must be 5MB or less')
  )
};

/**
 * Setting-specific validators
 */
export const settingValidators = {
  name: combineValidators(
    validators.required('Setting name is required'),
    validators.minLength(3, 'Name must be at least 3 characters'),
    validators.maxLength(100, 'Name must be 100 characters or less')
  ),

  description: combineValidators(
    validators.required('Description is required'),
    validators.minLength(10, 'Description must be at least 10 characters'),
    validators.maxLength(1000, 'Description must be 1000 characters or less')
  ),

  settingType: validators.required('Please select a setting type'),

  image: combineValidators(
    fileValidators.imageFile(),
    fileValidators.fileSize(10 * 1024 * 1024, 'Setting image must be 10MB or less')
  )
};

/**
 * Form validation schema type
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: Validator<T[K]>;
};

/**
 * Validate an entire object against a schema
 */
export function validateObject<T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema<T>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  Object.keys(schema).forEach((key) => {
    const validator = schema[key as keyof T];
    if (validator) {
      const result = validator(data[key as keyof T]);
      if (!result.isValid) {
        errors[key as keyof T] = result.error;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
}

/**
 * Character form validation schema
 */
export const characterFormSchema: ValidationSchema<any> = {
  name: characterValidators.name,
  archetype: characterValidators.archetype,
  chatbotRole: characterValidators.chatbotRole,
  description: characterValidators.description,
  primaryTraits: characterValidators.traits,
  colors: characterValidators.colors,
  avatarImage: characterValidators.avatar
};

/**
 * Setting form validation schema
 */
export const settingFormSchema: ValidationSchema<any> = {
  name: settingValidators.name,
  description: settingValidators.description,
  settingType: settingValidators.settingType,
  imageUrl: settingValidators.image
};

/**
 * Real-time validation hook for forms
 */
export function createFormValidator<T extends Record<string, any>>(
  schema: ValidationSchema<T>
) {
  return {
    validateField: (field: keyof T, value: any) => {
      const validator = schema[field];
      return validator ? validator(value) : { isValid: true };
    },
    
    validateForm: (data: T) => validateObject(data, schema),
    
    getFieldValidator: (field: keyof T) => schema[field]
  };
}