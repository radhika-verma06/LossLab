"""
LossLab API for AI-Agent Red-Teaming Platform

Provides REST endpoints for:
- Listing available agent types
- Running deterministic tests against agent traces
- Retrieving detailed reports of test runs
- Serving the main application interface
"""

from flask import Flask, jsonify, request, render_template
from risk_engine import RiskEngine, get_skybridge_airline_refund_scenario, get_saas_discount_scenario, get_fraud_operations_scenario
import json
import uuid
from datetime import datetime

app = Flask(__name__)
engine = RiskEngine()

# In-memory storage for run results (in production, use a database)
run_results = {}

# Agent type definitions
AGENT_TYPES = [
    {
        "id": "airline_refund",
        "name": "Airline Refund Agent",
        "description": "Handles flight cancellation and refund requests",
        "scenario": "skybridge-refund-demo"
    },
    {
        "id": "saas_discount",
        "name": "SaaS Discount Agent",
        "description": "Applies promotional discounts to subscription services",
        "scenario": "saas-discount-demo"
    },
    {
        "id": "fraud_operations",
        "name": "Fraud Operations Agent",
        "description": "Monitors and flags potentially fraudulent transactions",
        "scenario": "fraud-ops-demo"
    }
]


@app.route('/')
def index():
    """Serve the main application interface."""
    return render_template('index.html')


@app.route('/api/v1/agents', methods=['GET'])
def get_agents():
    """Return list of available agent types for testing."""
    return jsonify(AGENT_TYPES)


@app.route('/api/v1/runs', methods=['POST'])
def create_run():
    """
    Execute a deterministic test run for a specific agent type.
    
    Expected JSON payload:
    {
        "agent_type": "airline_refund",
        "apply_guardrails": false
    }
    """
    data = request.get_json()
    
    if not data or 'agent_type' not in data:
        return jsonify({"error": "agent_type is required"}), 400
    
    agent_type = data['agent_type']
    apply_guardrails = data.get('apply_guardrails', False)
    
    # Validate agent type
    valid_agent_types = [at['id'] for at in AGENT_TYPES]
    if agent_type not in valid_agent_types:
        return jsonify({"error": f"Invalid agent_type. Must be one of {valid_agent_types}"}), 400
    
    # Get the appropriate scenario
    scenario_map = {
        "airline_refund": get_skybridge_airline_refund_scenario,
        "saas_discount": get_saas_discount_scenario,
        "fraud_operations": get_fraud_operations_scenario
    }
    
    trace_id, actions = scenario_map[agent_type]()
    
    # Run the evaluation
    result = engine.evaluate_trace(
        trace_id=trace_id,
        actions=actions,
        policy_key=agent_type,
        apply_guardrails=apply_guardrails
    )
    
    # Store result for later retrieval
    run_id = str(uuid.uuid4())
    run_results[run_id] = {
        "result": result,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "agent_type": agent_type,
        "apply_guardrails": apply_guardrails
    }
    
    # Return summary (full report available via GET /api/v1/reports/<run_id>)
    return jsonify({
        "run_id": run_id,
        "agent_type": agent_type,
        "apply_guardrails": apply_guardrails,
        "timestamp": run_results[run_id]["timestamp"],
        "summary": {
            "total_actions": len(result.actions),
            "violations_count": len(result.violations),
            "blocked_actions_count": len(result.blocked_actions),
            "total_exposure_cents": result.total_exposure_cents,
            "prevented_exposure_cents": result.prevented_exposure_cents
        }
    }), 201


@app.route('/api/v1/reports/<run_id>', methods=['GET'])
def get_report(run_id):
    """Return detailed report for a specific test run."""
    if run_id not in run_results:
        return jsonify({"error": "Run not found"}), 404
    
    stored = run_results[run_id]
    result = stored["result"]
    
    # Convert dataclasses to dictionaries for JSON serialization
    def action_to_dict(action):
        return {
            "action_type": action.action_type.value,
            "transaction_id": action.transaction_id,
            "amount_cents": action.amount_cents,
            "timestamp": action.timestamp,
            "metadata": action.metadata
        }
    
    def violation_to_dict(violation):
        return {
            "rule_id": violation.rule_id.value,
            "description": violation.description,
            "action": action_to_dict(violation.action),
            "financial_impact_cents": violation.financial_impact_cents,
            "blocked": violation.blocked
        }
    
    report = {
        "run_id": run_id,
        "timestamp": stored["timestamp"],
        "agent_type": stored["agent_type"],
        "apply_guardrails": stored["apply_guardrails"],
        "trace_id": result.trace_id,
        "actions": [action_to_dict(a) for a in result.actions],
        "violations": [violation_to_dict(v) for v in result.violations],
        "blocked_actions": [action_to_dict(a) for a in result.blocked_actions],
        "total_exposure_cents": result.total_exposure_cents,
        "prevented_exposure_cents": result.prevented_exposure_cents,
        "net_exposure_cents": result.total_exposure_cents - result.prevented_exposure_cents
    }
    
    return jsonify(report)


# Keep the original endpoints for backward compatibility (optional)
# In a production version, these might be removed or versioned differently
@app.route('/api/policies')
def get_policies_legacy():
    # Return simplified policy info for compatibility
    return jsonify([
        {"id": "airline_refund", "name": "Airline Refund Policy"},
        {"id": "saas_discount", "name": "SaaS Discount Policy"},
        {"id": "fraud_operations", "name": "Fraud Operations Policy"}
    ])


@app.route('/api/financial')
def get_financial_legacy():
    # Return simplified financial info for compatibility
    return jsonify([
        {"id": "duplicate_refund", "name": "Duplicate Refund Exposure", "risk_score": 0.8},
        {"id": "approval_limit", "name": "Approval Limit Breach", "risk_score": 0.6},
        {"id": "daily_limit", "name": "Daily Limit Exceeded", "risk_score": 0.7}
    ])


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)