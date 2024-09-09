# Temporary ToDo File

1. Make sure the update AWS github action validates the openapi spec
2. going to need an account activation step of some kind, either email or sms
3. can user/driver change email/phone #? Makes sense in a way, but how to prevent account hijacking?
4. Will we need to store the driver's dl #? What about insurance? Going to punt on that for now.
5. Does the drive have to put in the vehicle info, etc. to create the account, or can that be done later? Obviously they can't pick up a job without it.
7. Password reset!0
8. PII! If we store any of this kind of stuff, we have to be incredibly careful with how we deal with it.
9. It's fine and well to implement a delete operation for pickups, but in reality either the driver or the client should be able to cancel them. How are we going to handle that?
10. Only user should be able to update pickup location, size, etc. What about time? Can either of them change that? Or would the driver have to request the user change it? Remember, the driver can always cancel it, though.
11. Issue tracking software? Jira? 
12. Documentation will become an issue soon enough, too. Confluence?
13. For admin frontend, does Next make the most sense?
14. Cognito user name is case sensitive. Is that bad?
