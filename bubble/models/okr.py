import base64
import json

import requests
from odoo import api, fields, models, tools
from odoo.exceptions import ValidationError
from odoo.tools.float_utils import float_compare
from odoo.tools.safe_eval import safe_eval, test_python_expr
from pytz import timezone


class Okr(models.Model):
    _name = "okr"
    _description = "OKR"

    okr_code = fields.Char("Unique Code")
    objective_id = fields.Many2one("objective", string="Objective")
    name = fields.Char(string="Name")
    type = fields.Selection(
        [("personal", "Personal"), ("bubble", "Bubble"), ("role", "Role")],
        string="Type",
        default="personal",
    )
    company_id = fields.Many2one("res.company", string="Company")
    description = fields.Text(string="Description")
    bubble_id = fields.Many2one("bubble", string="Bubble")
    user_id = fields.Many2one("res.users", string="User")
    bubble_role_id = fields.Many2one("bubble.role", string="Role")
    active = fields.Boolean(string="Active", default=True)
    status = fields.Selection(
        [("active", "Active"), ("inactive", "Inactive")],
        string="Status",
        default="active",
    )
    code = fields.Text(string="Code", groups="bubble.group_bubble_administrator")
    with_automation = fields.Boolean()
    child_objective_ids = fields.One2many("objective", "parent_okr_id")

    @api.constrains("code")
    def _check_python_code(self):
        for action in self.sudo().filtered("code"):
            msg = test_python_expr(expr=action.code.strip(), mode="exec")
            if msg:
                raise ValidationError(msg)

    @api.model
    def _get_eval_context(self, okr_result, action=None):
        def log(message, level="info"):
            with self.pool.cursor() as cr:
                cr.execute(
                    """
                    INSERT INTO ir_logging(create_date, create_uid, type, dbname, name, level, message, path, line, func)
                    VALUES (NOW() at time zone 'UTC', %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                    (
                        self.env.uid,
                        "server",
                        self._cr.dbname,
                        __name__,
                        level,
                        message,
                        "action",
                        self.id,
                        self.name,
                    ),
                )

        """ evaluation context to pass to safe_eval """
        return {
            "uid": self._uid,
            "user": self.env.user,
            "time": tools.safe_eval.time,
            "datetime": tools.safe_eval.datetime,
            "dateutil": tools.safe_eval.dateutil,
            "timezone": timezone,
            "float_compare": float_compare,
            "b64encode": base64.b64encode,
            "b64decode": base64.b64decode,
            "okr": self,
            "okr_result": okr_result,
            "env": self.env,
            "request": requests.request,
            "json_dumps": json.dumps,
            "json_load": json.load,
            "log": log,
        }

    def _run_action_code(self, okr_result):
        eval_context = self._get_eval_context(okr_result)
        safe_eval(
            self.code.strip(), eval_context, mode="exec", nocopy=True
        )  # nocopy allows to return 'action'
        return eval_context.get("action")
