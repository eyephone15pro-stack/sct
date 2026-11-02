import numpy as np

# First pattern
x1 = np.array([1, 1, 1, -1, 1, -1, 1, 1, 1])

# Second pattern
x2 = np.array([1, 1, 1, 1, -1, 1, 1, 1, 1])

# Target outputs
y = np.array([1, -1])

# Initialize weights and bias
wtold = np.zeros(9, dtype=int)
wtnew = np.zeros(9, dtype=int)
b = 0

# First input with target = 1
print("First input with target = 1")

for i in range(9):
    wtnew[i] = wtold[i] + x1[i] * y[0]

wtold = wtnew.copy()
b = b + y[0]

print("New weights =", wtnew)
print("Bias value =", b)

# Second input with target = -1
print("\nSecond input with target = -1")

for i in range(9):
    wtnew[i] = wtold[i] + x2[i] * y[1]

b = b + y[1]

print("New weights =", wtnew)
print("Bias value =", b)