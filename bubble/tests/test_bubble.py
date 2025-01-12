# -*- coding: utf-8 -*-
from odoo.exceptions import ValidationError
from odoo.tests.common import TransactionCase


class TestBubble(TransactionCase):

    def setUp(self):
        super(TestBubble, self).setUp()
        self.Bubble = self.env["bubble"]
        self.ResUsers = self.env["res.users"]
        # Creazione di un utente di test (aggiungi i parametri necessari)
        self.test_user = self.ResUsers.create(
            {"name": "Test User", "login": "test_user"}
        )

    def test_run_action_code(self):
        # Creare un nuovo tipo di bolla con codice eseguibile
        bubble = self.Bubble.create(
            {"name": "Executable Code", "code": 'action = "Test Action"'}
        )
        result = bubble._run_action_code()
        self.assertEqual(result, "Test Action")

    def test_compute_member_count(self):
        bubble = self.Bubble.create({"name": "Test Bubble"})
        # Inizialmente, il conteggio dei membri dovrebbe essere 0
        self.assertEqual(
            bubble.member_count, 0, "Il conteggio iniziale dei membri non è corretto"
        )

        # Aggiungere un membro e verificare il conteggio
        bubble.write({"member_ids": [(4, self.test_user.id)]})
        self.assertEqual(
            bubble.member_count,
            1,
            "Il conteggio dei membri dopo l'aggiunta non è corretto",
        )

    def test_action_freeze(self):
        bubble = self.Bubble.create({"name": "Test Bubble"})
        bubble.action_freeze()
        self.assertEqual(
            bubble.status,
            "freeze",
            "Il metodo action_freeze non ha aggiornato correttamente lo stato",
        )

    def test_check_python_code_valid(self):
        bubble = self.Bubble.create(
            {"name": "Test Bubble", "code": 'print("hello world")'}
        )
        # Nessuna eccezione dovrebbe essere sollevata per il codice valido
        bubble._check_python_code()

    def test_check_python_code_invalid(self):
        with self.assertRaises(ValidationError):
            bubble = self.Bubble.create({"name": "Test Bubble", "code": "import os"})
            # Verifica che un ValidationError sia sollevato per il codice non sicuro
            bubble._check_python_code()
