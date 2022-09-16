# tests/test_solution.py
import unittest

# TODO Fix `solution` not resolved
from solution import add


class TestAddition(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(1, 1), 2)
