# Supervised Learning

import numpy as np

np.set_printoptions(precision=2)

x = np.zeros(3)
weights = np.zeros(3)
desired = np.zeros(3)
actual = np.zeros(3)

# Input values
for i in range(3):
    x[i] = float(input("Initial input: "))

# Initial weights
for i in range(3):
    weights[i] = float(input("Initial weight: "))

# Desired output
for i in range(3):
    desired[i] = float(input("Desired output: "))

# Learning rate
a = float(input("Enter learning rate: "))

# Calculate actual output
actual = x * weights

print("Actual:", actual)
print("Desired:", desired)

# Weight adjustment
count = 0

while not np.allclose(desired, actual, atol=0.01):

    for i in range(3):
        weights[i] = weights[i] + a * (desired[i] - actual[i]) * x[i]

    actual = x * weights

    print("Weights:", weights)
    print("Actual:", actual)
    print("Desired:", desired)
    print("*" * 30)

    count = count + 1

    if count >= 1000:
        print("Learning stopped: maximum iterations reached.")
        break

print("Final output")
print("Corrected weights:", weights)
print("Actual:", actual)
print("Desired:", desired)