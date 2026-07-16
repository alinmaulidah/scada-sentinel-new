import unittest

from analysis import calculate_classification_metrics


class ClassificationMetricTests(unittest.TestCase):
    def test_statuses_are_evaluated_as_binary_anomaly_predictions(self):
        metrics = calculate_classification_metrics(
            [0, 1, 1, 0],
            ["normal", "anomali", "warning", "normal"],
        )

        self.assertEqual(metrics["accuracy"], 1.0)
        self.assertEqual(metrics["precision"], 1.0)
        self.assertEqual(metrics["recall"], 1.0)
        self.assertEqual(metrics["f1"], 1.0)


if __name__ == "__main__":
    unittest.main()
