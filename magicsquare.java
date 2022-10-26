// Java program to generate odd sized magic squares
import java.io.*;

class GFG {
	// Function to generate odd sized magic squares
	static void generateSquare(int n)
	{
		int[][] magicSquare = new int[n][n];

		// Initialize position for 1
		int i = n / 2;
		int j = n - 1;

		// One by one put all values in magic square
		for (int num = 1; num <= n * n;) {
			if (i == -1 && j == n) // 3rd condition
			{
				j = n - 2;
				i = 0;
			}
			else {
				// 1st condition helper if next number
				// goes to out of square's right side
				if (j == n)
					j = 0;

				// 1st condition helper if next number is
				// goes to out of square's upper side
				if (i < 0)
					i = n - 1;
			}

			// 2nd condition
			if (magicSquare[i][j] != 0) {
				j -= 2;
				i++;
				continue;
			}
			else
				// set number
				magicSquare[i][j] = num++;

			// 1st condition
			j++;
			i--;
		}

		// print magic square
		System.out.println("The Magic Square for " + n
						+ ":");
		System.out.println("Sum of each row or column "
						+ n * (n * n + 1) / 2 + ":");
		for (i = 0; i < n; i++) {
			for (j = 0; j < n; j++)
				System.out.print(magicSquare[i][j] + " ");
			System.out.println();
		}
	}

	// driver program
	public static void main(String[] args)
	{
		// Works only when n is odd
		int n = 7;
		generateSquare(n);
	}
}

// Contributed by Pramod Kumar
