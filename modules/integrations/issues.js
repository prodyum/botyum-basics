// modules/integrations/issues.js
// Aggregates issues from GitHub, Jira, Trello, and Azure.


export function createIssuesGroup(ctx) {
  const { inquirer, ok, warn, err, curl } = ctx;

  async function handleIssues() {
    const { service } = await inquirer.prompt([
      {
        type: "list",
        name: "service",
        message: "Hizmet",
        choices: ["GitHub Issues", "Jira", "Trello", "Azure Boards", "Geri"],
      },
    ]);
    if (service === "Geri") return;
    if (service === "GitHub Issues") {
      const input = await inquirer.prompt([
        { type: "input", name: "query", message: "Arama (örn: repo:owner/name is:issue is:open bug)" },
        { type: "input", name: "token", message: "GitHub token (opsiyonel)", default: process.env.GITHUB_TOKEN || "" },
      ]);
      try {
        const response = await curl(
          `https://api.github.com/search/issues?q=${encodeURIComponent(input.query)}`,
          {
            Accept: "application/vnd.github+json",
            ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
          },
          20,
        );
        const json = JSON.parse(response);
        (json.items || [])
          .slice(0, 10)
          .forEach((item) => console.log(`${ok(`#${item.number}`)} ${item.title}\n  ${item.html_url}`));
      } catch (error) {
        console.log(err(`GitHub hatası: ${error.message}`));
      }
      return;
    }
    if (service === "Jira") {
      const input = await inquirer.prompt([
        { type: "input", name: "base", message: "Jira base URL (https://org.atlassian.net)" },
        { type: "input", name: "email", message: "E-posta" },
        { type: "password", name: "token", message: "API token" },
        { type: "input", name: "jql", message: "JQL" },
      ]);
      try {
        const response = await curl(
          `${input.base.replace(/\/$/, "")}/rest/api/2/search?jql=${encodeURIComponent(input.jql)}`,
          {
            Accept: "application/json",
            Authorization: `Basic ${Buffer.from(`${input.email}:${input.token}`).toString("base64")}`,
          },
          20,
        );
        const json = JSON.parse(response);
        (json.issues || [])
          .slice(0, 10)
          .forEach((issue) => console.log(`${ok(issue.key)} ${issue.fields.summary}`));
      } catch (error) {
        console.log(err(`Jira hatası: ${error.message}`));
      }
      return;
    }
    if (service === "Trello") {
      const input = await inquirer.prompt([
        { type: "input", name: "key", message: "Trello key", default: process.env.TRELLO_KEY || "" },
        { type: "input", name: "token", message: "Trello token", default: process.env.TRELLO_TOKEN || "" },
        { type: "input", name: "query", message: "Arama" },
      ]);
      try {
        const response = await curl(
          `https://api.trello.com/1/search?query=${encodeURIComponent(input.query)}&key=${input.key}&token=${input.token}`,
          { Accept: "application/json" },
          20,
        );
        const json = JSON.parse(response);
        (json.cards || [])
          .slice(0, 10)
          .forEach((card) => console.log(`${ok(card.name)} (${card.idShort})\n  ${card.shortUrl}`));
      } catch (error) {
        console.log(err(`Trello hatası: ${error.message}`));
      }
      return;
    }
    if (service === "Azure Boards") {
      const input = await inquirer.prompt([
        { type: "input", name: "org", message: "Org (dev.azure.com/{org})" },
        { type: "input", name: "project", message: "Project" },
        { type: "password", name: "pat", message: "PAT" },
        { type: "input", name: "wiql", message: "WIQL sorgu" },
      ]);
      try {
        const wiqlBody = JSON.stringify({ query: input.wiql });
        const wiqlResponse = await curl(
          `https://dev.azure.com/${input.org}/${input.project}/_apis/wit/wiql?api-version=7.0`,
          {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`:${input.pat}`).toString("base64")}`,
          },
          20,
          "POST",
          wiqlBody,
        );
        const wiqlJson = JSON.parse(wiqlResponse);
        const ids = (wiqlJson.workItems || []).slice(0, 10).map((item) => item.id).join(",");
        if (!ids) {
          console.log(warn("Kayıt yok."));
          return;
        }
        const items = JSON.parse(
          await curl(
            `https://dev.azure.com/${input.org}/${input.project}/_apis/wit/workitems?ids=${ids}&api-version=7.0`,
            { Authorization: `Basic ${Buffer.from(`:${input.pat}`).toString("base64")}` },
            20,
          ),
        );
        (items.value || []).forEach((item) => console.log(`${ok(`#${item.id}`)} ${item.fields["System.Title"]}`));
      } catch (error) {
        console.log(err(`Azure Boards hatası: ${error.message}`));
      }
    }
  }

  return {
    id: "issues-hub",
    label: "Issue takibi",
    description: "GitHub, Jira, Trello ve Azure Boards sorguları.",
    items: [{ id: "issues-hub-run", label: "Issue ara", run: handleIssues }],
  };
}




