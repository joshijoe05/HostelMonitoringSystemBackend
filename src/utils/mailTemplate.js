const verificationTemplate = (name, token) => {
    return `
    <h1>Hello ${name}</h1>
    <p>Thank you for registering with us. Please verify your email by clicking the link below</p>
    <a href="${process.env.BASE_URL}/verify/${token}">Verify Email</a>
    `;
}

module.exports = { verificationTemplate };