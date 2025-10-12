import httpx
from app.core.config import settings

class NotificationService:
    async def send_approval(
        self,
        workflow_id: str,
        node_id: str,
        title: str,
        description: str,
        approvers: list[str],
        channels: list[str]
    ):
        """Send approval request via configured channels"""
        if "slack" in channels and settings.SLACK_WEBHOOK_URL:
            await self._send_slack(workflow_id, node_id, title, description)
        
        if "email" in channels and settings.RESEND_API_KEY:
            await self._send_email(approvers, title, description, workflow_id, node_id)
    
    async def _send_slack(self, workflow_id: str, node_id: str, title: str, description: str):
        """Send Slack message with approval buttons"""
        async with httpx.AsyncClient() as client:
            await client.post(
                settings.SLACK_WEBHOOK_URL,
                json={
                    "text": f"🔔 {title}",
                    "blocks": [
                        {
                            "type": "section",
                            "text": {"type": "mrkdwn", "text": f"*{title}*\n{description}"}
                        },
                        {
                            "type": "actions",
                            "elements": [
                                {
                                    "type": "button",
                                    "text": {"type": "plain_text", "text": "✅ Approve"},
                                    "style": "primary",
                                    "url": f"http://localhost:3000/approve/{workflow_id}/{node_id}?action=approve"
                                },
                                {
                                    "type": "button",
                                    "text": {"type": "plain_text", "text": "❌ Reject"},
                                    "style": "danger",
                                    "url": f"http://localhost:3000/approve/{workflow_id}/{node_id}?action=reject"
                                }
                            ]
                        }
                    ]
                }
            )
    
    async def _send_email(self, approvers: list[str], title: str, description: str, workflow_id: str, node_id: str):
        """Send email via Resend"""
        async with httpx.AsyncClient() as client:
            for approver in approvers:
                await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                    json={
                        "from": settings.FROM_EMAIL,
                        "to": [approver],
                        "subject": title,
                        "html": f"""
                        <h2>{title}</h2>
                        <p>{description}</p>
                        <a href="http://localhost:3000/approve/{workflow_id}/{node_id}?action=approve">
                            Approve
                        </a> | 
                        <a href="http://localhost:3000/approve/{workflow_id}/{node_id}?action=reject">
                            Reject
                        </a>
                        """
                    }
                )
