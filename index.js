import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const JIRA_URL = 'https://exprealtyengineering.atlassian.net';
const AUTH_HEADER = `Basic ${process.env.JIRA_AUTH}`;

app.post('/create-ticket', async (req, res) => {
  const { summary, description, projectKey, priority, assignee, labels } = req.body;

  const ticketPayload = {
    fields: {
      project: { key: projectKey },
      summary,
      description: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: description }]
        }]
      },
      issuetype: { name: 'Bug' },
      priority: { name: priority || 'Medium' },
      labels: labels || []
    }
  };

  if (assignee) {
    ticketPayload.fields.assignee = { name: assignee };
  }

  try {
    const response = await axios.post(`${JIRA_URL}/rest/api/3/issue`, ticketPayload, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const issueKey = response.data.key;
    const issueUrl = `${JIRA_URL}/browse/${issueKey}`;

    res.status(201).json({
      success: true,
      issueKey,
      issueUrl,
      message: `Ticket created: ${issueUrl}`
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('Jira Ticket API is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
