#!/bin/bash

# Sorot.AI Monitoring and Budget Setup Script
set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STACK_NAME="sorot-ai-stack"
BUDGET_AMOUNT=5.0
ALERT_EMAIL="${ALERT_EMAIL:-}"

echo "📊 Setting up monitoring and budget alerts for Sorot.AI"

# Validate AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

# Get Lambda function name from stack
LAMBDA_FUNCTION=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
    --output text 2>/dev/null | awk -F: '{print $NF}')

if [ -z "$LAMBDA_FUNCTION" ]; then
    echo "⚠️  Lambda function not found. Please deploy first."
    exit 1
fi

echo "🔍 Lambda function: $LAMBDA_FUNCTION"

# Setup Budget Alert ($5/month)
echo "💰 Setting up budget alert..."
BUDGET_EXISTS=$(aws budgets describe-budget \
    --account-id $ACCOUNT_ID \
    --budget-name "SorotAI-Monthly-Budget" \
    --query 'Budget.BudgetName' \
    --output text 2>/dev/null || echo "")

if [ -z "$BUDGET_EXISTS" ]; then
    echo "🆕 Creating new budget alert..."

    # Create budget with notification
    aws budgets create-budget \
        --account-id $ACCOUNT_ID \
        --budget "{
            \"BudgetName\": \"SorotAI-Monthly-Budget\",
            \"BudgetLimit\": {
                \"Amount\": \"$BUDGET_AMOUNT\",
                \"Unit\": \"USD\"
            },
            \"TimeUnit\": \"MONTHLY\",
            \"BudgetType\": \"COST\"
        }" \
        --notifications-with-subscribers "[{
            \"Notification\": {
                \"NotificationType\": \"ACTUAL\",
                \"ComparisonOperator\": \"GREATER_THAN\",
                \"Threshold\": 80,
                \"ThresholdType\": \"PERCENTAGE\"
            },
            \"Subscribers\": [{
                \"SubscriptionType\": \"EMAIL\",
                \"Address\": \"${ALERT_EMAIL:-noreply@sorot.ai}\"
            }]
        }]"

    echo "✅ Budget alert created: $$BUDGET_AMOUNT/month threshold"
else
    echo "✅ Budget alert already exists"
fi

# Setup CloudWatch Alarms
echo "🚨 Setting up CloudWatch alarms..."

# Lambda Errors Alarm
ERROR_ALARM_EXISTS=$(aws cloudwatch describe-alarms \
    --alarm-names "SorotAI-Lambda-Errors" \
    --query 'MetricAlarms[0].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$ERROR_ALARM_EXISTS" ]; then
    aws cloudwatch put-metric-alarm \
        --alarm-name "SorotAI-Lambda-Errors" \
        --alarm-description "Alert when Lambda function errors occur" \
        --metric-name Errors \
        --namespace AWS/Lambda \
        --statistic Sum \
        --period 300 \
        --threshold 1 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION \
        --evaluation-periods 1 \
        --alarm-actions "arn:aws:sns:$AWS_REGION:$ACCOUNT_ID:SorotAI-Alerts" 2>/dev/null || \
        echo "⚠️  SNS topic not configured - alarm created without notification"

    echo "✅ Lambda errors alarm created"
else
    echo "✅ Lambda errors alarm already exists"
fi

# Lambda Duration Alarm (for performance monitoring)
DURATION_ALARM_EXISTS=$(aws cloudwatch describe-alarms \
    --alarm-names "SorotAI-Lambda-Duration" \
    --query 'MetricAlarms[0].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$DURATION_ALARM_EXISTS" ]; then
    aws cloudwatch put-metric-alarm \
        --alarm-name "SorotAI-Lambda-Duration" \
        --alarm-description "Alert when Lambda function duration exceeds 50 seconds" \
        --metric-name Duration \
        --namespace AWS/Lambda \
        --statistic Average \
        --period 300 \
        --threshold 50000 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION \
        --evaluation-periods 1 \
        --alarm-actions "arn:aws:sns:$AWS_REGION:$ACCOUNT_ID:SorotAI-Alerts" 2>/dev/null || \
        echo "⚠️  SNS topic not configured - alarm created without notification"

    echo "✅ Lambda duration alarm created"
else
    echo "✅ Lambda duration alarm already exists"
fi

# Setup CloudWatch Dashboard (optional but recommended)
echo "📈 Setting up CloudWatch dashboard..."

DASHBOARD_BODY=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/Lambda", "Invocations", "FunctionName", "$LAMBDA_FUNCTION"],
                    [".", "Errors", ".", "."],
                    [".", "Duration", ".", "."]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "Sorot.AI Lambda Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/ApiGateway", "Count", "ApiName", "sorot-ai-api", "Method", "POST", "Resource", "/analyze"],
                    [".", ".", ".", ".", "Method", "GET", "Resource", "/status"]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "API Gateway Metrics",
                "period": 300
            }
        }
    ]
}
EOF
)

aws cloudwatch put-dashboard \
    --dashboard-name "SorotAI-Monitoring" \
    --dashboard-body "$DASHBOARD_BODY" >/dev/null 2>&1 && \
    echo "✅ CloudWatch dashboard created" || \
    echo "⚠️  Dashboard creation failed (may already exist)"

# Cost Explorer setup (for better cost tracking)
echo "💸 Setting up Cost Allocation Tags..."
aws ce update-cost-allocation-tags-status \
    --cost-allocation-tags-status "[{\"TagKey\": \"sorot-ai-stack\", \"Status\": \"Active\"}]" 2>/dev/null || \
    echo "⚠️  Cost allocation tags setup failed (may not be available in all regions)"

# Display monitoring information
echo ""
echo "✅ Monitoring setup complete!"
echo ""
echo "📊 Monitoring Resources:"
echo "  Budget Alert: $BUDGET_AMOUNT/month threshold (80% warning)"
echo "  Lambda Errors Alarm: SorotAI-Lambda-Errors"
echo "  Lambda Duration Alarm: SorotAI-Lambda-Duration"
echo "  CloudWatch Dashboard: SorotAI-Monitoring"
echo ""
echo "🔗 Useful Links:"
echo "  CloudWatch Dashboard: https://$AWS_REGION.console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=SorotAI-Monitoring"
echo "  Budgets: https://console.aws.amazon.com/billing/home?#/budgets"
echo "  Lambda Metrics: https://$AWS_REGION.console.aws.amazon.com/lambda/home?region=$AWS_REGION#/functions/$LAMBDA_FUNCTION?tab=monitoring"
echo ""
echo "💡 Pro Tips:"
echo "  - Monitor your actual costs in AWS Cost Explorer"
echo "  - Set up billing alerts for your account if needed"
echo "  - Review CloudWatch logs regularly for optimization opportunities"
