import { z } from 'zod';
import { PRODUCT_BADGES, PRODUCT_STATUSES } from '@/server/models/Product';
import { CONTACT_MESSAGE_STATUSES } from '@/server/models/ContactMessage';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/server/models/Order';
import { USER_ROLES, USER_STATUSES } from '@/server/models/User';
import { UPLOAD_TARGETS } from '@/server/cloudinary';
import { SHIPPING_COUNTRIES } from '@/utils/shipping';
import { slugify } from '@/utils/slug';
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_SUBJECT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  hasDigit,
  isPersonName,
  isStrongPassword,
} from '@/utils/validation';

/** Request schemas for the API routes (zod). Field errors reach the UI as `{ 'name.en': 'message' }`. */

const text = (max = 5000) => z.string().trim().max(max).default('');
// The storefront language a request comes from; anything else counts as English.
const storeLocale = z.enum(['en', 'sv', 'el']).catch('en');
const emailAddress = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'));

const localized = ({ required = false, max = 5000 } = {}) =>
  z.object({
    en: required ? z.string().trim().min(1, 'English text is required').max(max) : text(max),
    sv: text(max),
    el: text(max),
  });

const objectId = (message) => z.string().regex(/^[a-f\d]{24}$/i, message);

const imageUrl = z
  .string()
  .trim()
  .min(1)
  .refine((value) => value.startsWith('/') || value.startsWith('https://'), 'Invalid image URL');

export const imageInput = z.object({
  url: imageUrl,
  publicId: z.string().trim().default(''),
  alt: z.string().trim().max(200).default(''),
});

export const productInput = z
  .object({
    name: localized({ required: true, max: 160 }),
    sku: text(60),
    // Empty → generated from the name when saved.
    slug: text(80).transform(slugify),
    // Optional: an empty value leaves the product uncategorised.
    category: z
      .union([objectId('Choose a valid category'), z.literal(''), z.null()])
      .transform((value) => value || null)
      .default(null),
    description: localized({ max: 4000 }),
    images: z.array(imageInput).max(12, 'Up to 12 images per product'),
    variants: z
      .array(
        z.object({
          // Kustom order lines are referenced "<product id>:<key>", at most 64 characters.
          key: z
            .string()
            .trim()
            .min(1)
            .max(39)
            .regex(/^[a-z0-9-]+$/i, 'Letters, numbers and hyphens only'),
          label: localized({ required: true, max: 60 }),
          // Whole öre: Kustom is charged in öre, so a third decimal would make the amounts disagree.
          price: z.coerce
            .number({ message: 'Enter a price' })
            .min(0, 'Price cannot be negative')
            .max(1_000_000)
            .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'At most two decimals'),
          stock: z.coerce
            .number({ message: 'Enter a quantity' })
            .int('Whole numbers only')
            .min(0, 'Cannot be negative')
            .max(100_000),
          image: z.string().trim().default(''),
          // Packs only: the products inside one pack.
          contents: z
            .array(
              z.object({
                product: objectId('Choose a product'),
                variantKey: z.string().trim().min(1, 'Choose a size').max(40),
                quantity: z.coerce
                  .number({ message: 'Enter a quantity' })
                  .int('Whole numbers only')
                  .min(1, 'At least 1')
                  .max(1000),
              })
            )
            .max(30)
            .default([]),
        })
      )
      .min(1, 'Add at least one size')
      .max(12)
      .refine((variants) => new Set(variants.map((v) => v.key.toLowerCase())).size === variants.length, {
        message: 'Each size needs a different label',
      }),
    defaultVariant: z.string().trim().default(''),
    isPack: z.boolean().default(false),
    standardVat: z.boolean().default(false),
    badge: z.enum(PRODUCT_BADGES).default(''),
    featured: z.boolean().default(false),
    status: z.enum(PRODUCT_STATUSES).default('active'),
  })
  .strip()
  .superRefine((product, context) => {
    if (!product.isPack) return;
    product.variants.forEach((variant, index) => {
      if (!variant.contents.length) {
        context.addIssue({
          code: 'custom',
          path: ['variants', index, 'contents'],
          message: 'Add the products that go into this pack',
        });
      }
      const seen = new Set();
      variant.contents.forEach((item, position) => {
        const key = `${item.product}:${item.variantKey}`;
        if (seen.has(key)) {
          context.addIssue({
            code: 'custom',
            path: ['variants', index, 'contents', position, 'product'],
            message: 'Already in this pack — raise its quantity instead',
          });
        }
        seen.add(key);
      });
    });
  })
  // Only packs have contents (their stock is worked out from them when saved).
  .transform((product) =>
    product.isPack ? product : { ...product, variants: product.variants.map((variant) => ({ ...variant, contents: [] })) }
  );

/** Quick toggles from the product list. Stock is edited per size in the product form. */
export const productFlagsInput = z
  .object({
    featured: z.boolean().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
  })
  .strip()
  .refine((flags) => flags.featured !== undefined || flags.status !== undefined, 'Nothing to update');

export const categoryInput = z
  .object({
    slug: text(80).transform(slugify),
    name: localized({ required: true, max: 80 }),
    description: localized(),
    image: imageInput.nullable().default(null),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    active: z.boolean().default(true),
  })
  .strip();

export const orderStatusInput = z.object({
  status: z.enum(ORDER_STATUSES),
  note: text(500),
});

export const paymentStatusInput = z.object({ paymentStatus: z.enum(PAYMENT_STATUSES) });

export const adminNoteInput = z.object({ adminNote: text(2000) });

const password = z
  .string()
  .max(200)
  .refine(
    isStrongPassword,
    'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character'
  );

/** The ID token (JWT) returned by the Sign in with Google button. */
export const googleCredentialInput = z.object({ credential: z.string().min(20).max(5000) });

export const credentialsInput = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required').max(200),
  remember: z.boolean().optional().default(false),
});

export const registerInput = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password,
});

export const adminUserInput = registerInput.extend({ role: z.enum(USER_ROLES).default('admin') });

/** Ask for a reset link. `locale` picks the language of the email and the link it carries. */
export const forgotPasswordInput = z.object({ email: emailAddress, locale: storeLocale }).strip();

/** Spend a reset link: the token from the email plus the new password. */
export const resetPasswordInput = z.object({
  token: z.string().trim().min(20, 'This reset link is not valid').max(200),
  password,
}).strip();

/** The signed-in customer's own details (Account → Profile). */
export const profileInput = z.object({ name: z.string().trim().min(1, 'Name is required').max(120) }).strip();

/** Account → Password: the current password proves it is really them, not someone at an unlocked screen. */
export const changePasswordInput = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(200),
  newPassword: password,
}).strip();


export const userRoleInput = z.object({ role: z.enum(USER_ROLES) });
export const userStatusInput = z.object({ status: z.enum(USER_STATUSES) });

/**
 * Checkout request: the cart, the customer type (private or company, with the company name), the delivery
 * country (sets the shipping fee), an optional note and the storefront page to return to. Kustom Checkout
 * collects the rest of the customer's details.
 */
export const checkoutInput = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          variantId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(10000),
        })
      )
      .min(1, 'Your cart is empty')
      .max(50),
    // Like the WooCommerce shop: the customer buys as a private person or a company (then with its name).
    customerType: z.enum(['private', 'company']).default('private'),
    company: text(200),
    country: z.enum(SHIPPING_COUNTRIES).default('SE'),
    note: text(1000),
    locale: storeLocale,
    // Ticked at checkout to join the email list and claim the welcome offer.
    joinEmailList: z.boolean().default(false),
    returnPath: z.string().max(200).default(''),
  })
  .refine((input) => input.customerType === 'private' || input.company, {
    message: 'Company name is required',
    path: ['company'],
  });

/** The Kustom checkout order id from the confirmation redirect. */
export const confirmPaymentInput = z.object({
  orderId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/, 'Invalid order reference'),
});

/** The order Kustom posts to the validation callback (only the fields we check). */
export const kustomValidationInput = z
  .object({
    order_lines: z.array(z.object({ type: z.string(), reference: z.string().optional(), quantity: z.number() }).passthrough()),
  })
  .passthrough();

export const uploadSignatureInput = z.object({ target: z.enum(UPLOAD_TARGETS) });

// Hidden form field that people never see: bots fill it in, and their submissions are dropped.
const honeypot = z.string().max(500).default('');

/** "Notify me when available" for one size of a sold-out product. */
export const stockAlertInput = z
  .object({
    productId: objectId('Invalid product'),
    variantKey: z.string().trim().min(1).max(40),
    email: emailAddress,
    locale: storeLocale,
    website: honeypot,
  })
  .strip();

/** Newsletter sign-up from the storefront. */
export const newsletterInput = z.object({ email: emailAddress, locale: storeLocale, website: honeypot }).strip();

/** The contact form on the contact page. */
export const contactMessageInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'This field is required')
      .max(NAME_MAX_LENGTH, `Names can be at most ${NAME_MAX_LENGTH} characters`)
      .refine((value) => !hasDigit(value), 'Names cannot contain numbers')
      .refine(isPersonName, 'Names can only contain letters, spaces, apostrophes, hyphens and dots'),
    email: emailAddress,
    subject: z.string().trim().min(1, 'This field is required').max(CONTACT_SUBJECT_MAX_LENGTH),
    message: z.string().trim().min(10, 'Please write at least 10 characters').max(CONTACT_MESSAGE_MAX_LENGTH),
    locale: storeLocale,
    website: honeypot,
  })
  .strip();

/** Admin: mark a contact message as read or unread. */
export const contactMessageStatusInput = z.object({ status: z.enum(CONTACT_MESSAGE_STATUSES) }).strip();
