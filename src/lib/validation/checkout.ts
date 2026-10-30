import type { CheckoutForm } from "@/types";

// Reglas de los datos de la clienta en el checkout. Se usan en el navegador (mensaje inmediato)
// y en el servidor (que no debe fiarse de lo que mande el navegador).

type CustomerFields = Pick<CheckoutForm, "full_name" | "email" | "phone" | "id_type" | "id_number" | "address">;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Teléfono colombiano sin indicativo: acepta "+57 300 123 4567" y devuelve "3001234567". */
export function normalizePhone(raw: string): string {
  const digits = onlyDigits(raw);
  return digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
}

const letterCount = (value: string) => (value.match(/\p{L}/gu) ?? []).length;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Largo y formato del número según el tipo de documento
const DOCUMENT_RULES: Record<string, { test: (value: string) => boolean; message: string }> = {
  CC: { test: (v) => /^\d{5,10}$/.test(v), message: "La cédula debe tener entre 5 y 10 números, sin puntos ni letras." },
  CE: { test: (v) => /^\d{5,10}$/.test(v), message: "La cédula de extranjería debe tener entre 5 y 10 números." },
  NIT: { test: (v) => /^\d{8,11}$/.test(v), message: "El NIT debe tener entre 8 y 11 números, sin guion." },
  Pasaporte: { test: (v) => /^[A-Za-z0-9]{5,15}$/.test(v), message: "El pasaporte debe tener entre 5 y 15 letras o números." },
};

/** Devuelve el mensaje del primer dato inválido, o null si todo está bien. */
export function validateCustomerFields(fields: CustomerFields): string | null {
  const name = fields.full_name.trim().replace(/\s+/g, " ");
  if (letterCount(name) < 3 || name.split(" ").length < 2) {
    return "Ingresa tu nombre y apellido.";
  }

  if (!EMAIL_PATTERN.test(fields.email.trim())) return "El correo no es válido.";

  const phone = normalizePhone(fields.phone);
  if (!/^3\d{9}$/.test(phone)) {
    return "Ingresa un celular colombiano de 10 dígitos (empieza por 3).";
  }

  if (!fields.id_type) return "Selecciona el tipo de documento.";
  const rule = DOCUMENT_RULES[fields.id_type];
  const idNumber = fields.id_type === "Pasaporte" ? fields.id_number.trim() : onlyDigits(fields.id_number);
  if (!rule) return "Selecciona un tipo de documento válido.";
  // En documentos numéricos solo se toleran separadores (puntos, espacios, guion); las letras no se descartan en silencio
  if (fields.id_type !== "Pasaporte" && /[^\d.\s-]/.test(fields.id_number.trim())) return rule.message;
  if (!rule.test(idNumber)) return rule.message;
  if (idNumber === phone) return "El número de documento no puede ser igual al teléfono.";

  const address = fields.address.trim();
  if (letterCount(address) < 3 || address.length < 6) {
    return "Escribe tu dirección completa (por ejemplo: Calle 10 # 5-20, barrio Centro).";
  }
  const addressDigits = onlyDigits(address);
  if (addressDigits === phone || addressDigits === idNumber) {
    return "La dirección no puede ser igual al teléfono ni al documento.";
  }

  return null;
}
