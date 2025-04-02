
export const validateEcuadorianPhoneNumber = (phoneNumber) => {
    const cleanedNumber = phoneNumber.replace(/\D/g, '');

    if ((cleanedNumber.length === 10 && cleanedNumber.startsWith('09')) || (cleanedNumber.length === 9 && cleanedNumber.startsWith('9'))) {
        return cleanedNumber.length === 10 ? cleanedNumber.substring(1) : {cleanedNumber};
    }
    throw 'Numero de telefono no valido, debe empezar con 09 y tener 10 digitos';
}