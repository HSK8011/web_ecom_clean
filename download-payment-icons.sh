#!/bin/bash

# Create directory for payment icons if it doesn't exist
mkdir -p public/images/payments

# Download payment icons
# Visa icon (already working, including for reference)
curl -o public/images/payments/visa.png "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"

# Mastercard
curl -o public/images/payments/mastercard.png "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/2560px-Mastercard-logo.svg.png"

# PayPal
curl -o public/images/payments/paypal.png "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png"

# Apple Pay
curl -o public/images/payments/apple-pay.png "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/2560px-Apple_Pay_logo.svg.png"

# Make all payment icons readable
chmod 644 public/images/payments/* 