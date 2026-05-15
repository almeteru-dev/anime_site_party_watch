module.exports = {
	apps: [
		{
			name: "lycoris-backend",
			cwd: "./backend",
			script: "../lycoris_server",
			autorestart: true,
			env: {
				PORT: "8080",
			},
		},
		{
			name: "lycoris-frontend",
			cwd: "./frontend",
			script: "npm",
			args: "start",
			autorestart: true,
			env: {
				PORT: "3000",
			},
		},
	],
}

